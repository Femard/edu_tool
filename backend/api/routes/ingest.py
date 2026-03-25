import shutil
import tempfile
from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from api.schemas import IngestMockResponse, IngestResponse
from core.config import Settings
from ingestion.pipeline import ingest_mock_documents, ingest_pdf

router = APIRouter()


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
