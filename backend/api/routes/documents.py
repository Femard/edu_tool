from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from api.schemas import DocumentInfo, DocumentListResponse
from core.config import Settings
from search.vector_store import delete_document, get_document_chunks, get_document_list

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
                source_url=d.get("source_url", ""),
                type_ressource=d.get("type_ressource", ""),
            )
            for d in docs
        ]
    )


class DocumentTextResponse(BaseModel):
    filename: str
    text: str


@router.get("/documents/{filename:path}/text", response_model=DocumentTextResponse)
async def get_document_text(filename: str) -> DocumentTextResponse:
    """Return all stored text chunks for a document, concatenated."""
    settings = Settings()
    chunks = get_document_chunks(filename, settings)
    if not chunks:
        raise HTTPException(status_code=404, detail=f"Document '{filename}' introuvable.")
    return DocumentTextResponse(filename=filename, text="\n\n".join(chunks))


class DeleteResponse(BaseModel):
    deleted_chunks: int
    filename: str


@router.delete("/documents/{filename:path}", response_model=DeleteResponse)
async def delete_document_route(filename: str) -> DeleteResponse:
    """Delete all chunks for a given filename from ChromaDB."""
    settings = Settings()
    count = delete_document(filename, settings)
    if count == 0:
        raise HTTPException(status_code=404, detail=f"Document '{filename}' introuvable.")
    return DeleteResponse(deleted_chunks=count, filename=filename)
