"""Routes API pour l'intégration MCP data.gouv.fr."""

import asyncio

import structlog
from fastapi import APIRouter, BackgroundTasks, HTTPException, Query

from api.schemas import (
    GovDatasetSchema,
    GovIngestRequest,
    GovIngestResponse,
    GovResourceSchema,
    GovSearchResponse,
)
from core.config import Settings
from ingestion.chunker import chunk_text
from ingestion.mcp_gouv import (
    GovResource,
    MCPGouvError,
    download_resource_text,
    get_dataset_resources,
    search_datasets,
)
from ingestion.url_ingester import filename_from_url
from search.vector_store import get_index

router = APIRouter()
log = structlog.get_logger()


async def _multi_search(q: str, settings: Settings, max_results: int, source: str = "all") -> list:
    """Lance 1 ou 2 requêtes MCP en parallèle et fusionne les résultats (dédupliqués)."""
    if source == "eduscol":
        queries = [f"{q} eduscol", f"{q} éduscol éducation nationale"]
    else:
        edu_terms = {"éducation", "education", "nationale", "eduscol", "primaire", "scolaire"}
        queries = [q]
        if not any(t in q.lower() for t in edu_terms):
            queries.append(f"{q} éducation nationale primaire")

    batches = await asyncio.gather(
        *[search_datasets(qr, settings, max_results) for qr in queries],
        return_exceptions=True,
    )
    seen: set[str] = set()
    merged = []
    for batch in batches:
        if isinstance(batch, list):
            for ds in batch:
                if ds.id not in seen:
                    seen.add(ds.id)
                    merged.append(ds)
    return merged[:max_results]


@router.get("/gouv/search", response_model=GovSearchResponse)
async def gouv_search(
    q: str = Query(..., min_length=1),
    max_results: int = Query(default=12, ge=1, le=30),
    source: str = Query(default="all", pattern="^(all|eduscol)$"),
) -> GovSearchResponse:
    """Recherche des datasets gouvernementaux via MCP data.gouv.fr (sans ressources)."""
    settings = Settings()
    try:
        datasets = await _multi_search(q, settings, max_results, source)
    except MCPGouvError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return GovSearchResponse(
        datasets=[
            GovDatasetSchema(
                id=ds.id,
                title=ds.title,
                organization=ds.organization,
                description=ds.description,
            )
            for ds in datasets
        ],
        query=q,
    )


@router.get("/gouv/resources/{dataset_id}", response_model=list[GovResourceSchema])
async def gouv_resources(dataset_id: str) -> list[GovResourceSchema]:
    """Récupère les ressources d'un dataset (chargement à la demande)."""
    settings = Settings()
    ALLOWED_FORMATS = {"PDF", "CSV", "HTML", "TXT", ""}
    try:
        resources = await get_dataset_resources(dataset_id, settings)
    except MCPGouvError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return [
        GovResourceSchema(
            id=r.id,
            title=r.title,
            url=r.url,
            format=r.format,
            description=r.description,
        )
        for r in resources
        if r.format in ALLOWED_FORMATS
    ][:5]


@router.post("/gouv/ingest", status_code=202, response_model=GovIngestResponse)
async def gouv_ingest(
    body: GovIngestRequest,
    background_tasks: BackgroundTasks,
) -> GovIngestResponse:
    """Lance l'ingestion en arrière-plan d'une ressource gouvernementale (202 Accepted)."""
    background_tasks.add_task(_ingest_gov_task, body)
    return GovIngestResponse(
        status="accepted",
        message="Ingestion en cours en arrière-plan.",
        resource_id=body.resource_id,
    )


def _ingest_gov_task(body: GovIngestRequest) -> None:
    settings = Settings()
    try:
        resource = GovResource(
            id=body.resource_id,
            title=body.resource_title,
            url=body.resource_url,
            format="",
        )
        # Background tasks sont sync dans FastAPI ; asyncio.run() crée une boucle dédiée
        text = asyncio.run(download_resource_text(resource, settings))

        metadata = {
            "cycle": body.cycle,
            "niveau": body.niveau,
            "domaine": body.domaine,
            "type_ressource": body.type_ressource,
            "source": "MCP_Gouv",
            "filename": filename_from_url(body.resource_url) or body.resource_title[:80],
            "page_number": 1,
        }
        nodes = chunk_text(text, metadata, settings)
        get_index(settings).insert_nodes(nodes)
        log.info("gov_resource_ingested", resource_id=body.resource_id, chunks=len(nodes))
    except Exception as exc:
        log.error("gov_ingest_failed", resource_id=body.resource_id, error=str(exc))
