from typing import Optional

from fastapi import APIRouter

from api.schemas import SearchRequest, SearchResponse
from core.config import Settings
from search.hybrid_search import search

router = APIRouter()


@router.get("/search", response_model=SearchResponse)
async def search_documents(
    q: str,
    cycle: Optional[str] = None,
    niveau: Optional[str] = None,
    domaine: Optional[str] = None,
    type_ressource: Optional[str] = None,
    top_k: int = 10,
) -> SearchResponse:
    settings = Settings()
    request = SearchRequest(
        query=q,
        cycle=cycle,
        niveau=niveau,
        domaine=domaine,
        type_ressource=type_ressource,
        top_k=top_k,
    )
    results = search(request, settings)
    return SearchResponse(results=results, total=len(results), query=q)
