from fastapi import APIRouter, HTTPException, Query

from api.schemas import WebSearchResponse
from search.web_search import web_search as _web_search

router = APIRouter()


@router.get("/web-search", response_model=WebSearchResponse)
async def web_search_route(
    q: str = Query(..., min_length=1, description="Requête de recherche"),
    max_results: int = Query(default=8, ge=1, le=20),
) -> WebSearchResponse:
    try:
        results = _web_search(q, max_results)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Erreur de recherche web : {exc}") from exc
    return WebSearchResponse(results=results, query=q)
