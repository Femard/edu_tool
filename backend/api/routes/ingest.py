import shutil
import tempfile
from pathlib import Path

import structlog
from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, UploadFile

from api.schemas import IngestMockResponse, IngestResponse, IngestUrlRequest, IngestUrlResponse
from core.config import Settings
from ingestion.chunker import chunk_text
from ingestion.pipeline import ingest_mock_documents, ingest_pdf
from ingestion.url_ingester import fetch_and_extract, filename_from_url
from search.vector_store import get_index

router = APIRouter()
log = structlog.get_logger()


@router.post("/ingest", response_model=IngestResponse)
async def ingest_document(
    file: UploadFile = File(...),
    cycle: str = Form(...),
    niveau: str = Form(...),
    domaine: str = Form(...),
    type_ressource: str = Form(...),
    source: str = Form(...),
) -> IngestResponse:
    settings = Settings()

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = Path(tmp.name)

    try:
        count = ingest_pdf(
            tmp_path,
            {
                "cycle": cycle,
                "niveau": niveau,
                "domaine": domaine,
                "type_ressource": type_ressource,
                "source": source,
            },
            settings,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    finally:
        tmp_path.unlink(missing_ok=True)

    return IngestResponse(chunks_stored=count, filename=file.filename or "unknown.pdf")


@router.post("/ingest/mock", response_model=IngestMockResponse)
async def ingest_mock() -> IngestMockResponse:
    """Seed the vector store with mock MCP documents (useful for demo/testing)."""
    settings = Settings()
    count = ingest_mock_documents(settings)
    return IngestMockResponse(chunks_stored=count)


@router.post("/ingest/url", status_code=202, response_model=IngestUrlResponse)
async def ingest_url_route(
    body: IngestUrlRequest,
    background_tasks: BackgroundTasks,
) -> IngestUrlResponse:
    """Télécharge et ingère une ressource web en arrière-plan (202 Accepted immédiat)."""
    background_tasks.add_task(_ingest_url_task, body)
    return IngestUrlResponse(
        status="accepted",
        message="Ingestion en cours en arrière-plan.",
        url=body.url,
    )


def _ingest_url_task(body: IngestUrlRequest) -> None:
    settings = Settings()
    try:
        text, doc_type = fetch_and_extract(body.url)
        metadata = {
            "cycle": body.cycle,
            "niveau": body.niveau,
            "domaine": body.domaine,
            "type_ressource": body.type_ressource,
            "source": body.source,
            "filename": filename_from_url(body.url),
            "page_number": 1,
        }
        nodes = chunk_text(text, metadata, settings)
        get_index(settings).insert_nodes(nodes)
        log.info("url_ingested", url=body.url, chunks=len(nodes), doc_type=doc_type)
    except Exception as exc:
        log.error("url_ingest_failed", url=body.url, error=str(exc))
