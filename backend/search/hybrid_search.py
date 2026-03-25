from typing import Optional

from llama_index.core.vector_stores import ExactMatchFilter, MetadataFilters

from api.schemas import SearchRequest, SearchResult
from core.config import Settings
from search.vector_store import get_index


def build_metadata_filters(
    cycle: Optional[str],
    niveau: Optional[str],
    domaine: Optional[str],
    type_ressource: Optional[str],
) -> Optional[MetadataFilters]:
    filters = []
    if cycle:
        filters.append(ExactMatchFilter(key="cycle", value=cycle))
    if niveau:
        filters.append(ExactMatchFilter(key="niveau", value=niveau))
    if domaine:
        filters.append(ExactMatchFilter(key="domaine", value=domaine))
    if type_ressource:
        filters.append(ExactMatchFilter(key="type_ressource", value=type_ressource))
    return MetadataFilters(filters=filters) if filters else None


def search(request: SearchRequest, settings: Settings) -> list[SearchResult]:
    index = get_index(settings)
    metadata_filters = build_metadata_filters(
        request.cycle, request.niveau, request.domaine, request.type_ressource
    )

    retriever = index.as_retriever(
        similarity_top_k=request.top_k,
        filters=metadata_filters,
    )

    nodes = retriever.retrieve(request.query)

    return [
        SearchResult(
            score=node.score or 0.0,
            text=node.text[:500],
            metadata=node.metadata,
            chunk_id=node.node_id,
        )
        for node in nodes
    ]
