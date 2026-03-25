from fastapi import APIRouter

from api.schemas import DocumentInfo, DocumentListResponse
from core.config import Settings
from search.vector_store import get_document_list

router = APIRouter()


@router.get("/documents", response_model=DocumentListResponse)
async def list_documents() -> DocumentListResponse:
    """List all unique documents indexed in ChromaDB."""
    settings = Settings()
    docs = get_document_list(settings)
    return DocumentListResponse(
        documents=[
            DocumentInfo(
                filename=d.get("filename", ""),
                source=d.get("source", ""),
                cycle=d.get("cycle", ""),
                domaine=d.get("domaine", ""),
            )
            for d in docs
        ]
    )
