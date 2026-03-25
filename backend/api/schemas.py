from typing import Optional
from pydantic import BaseModel, Field


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1)
    cycle: Optional[str] = None
    niveau: Optional[str] = None
    domaine: Optional[str] = None
    type_ressource: Optional[str] = None
    top_k: int = Field(default=10, ge=1, le=50)


class SearchResult(BaseModel):
    score: float
    text: str
    metadata: dict
    chunk_id: str


class SearchResponse(BaseModel):
    results: list[SearchResult]
    total: int
    query: str


class IngestResponse(BaseModel):
    chunks_stored: int
    filename: str


class IngestMockResponse(BaseModel):
    chunks_stored: int


class GenerateRequest(BaseModel):
    query: str = Field(..., min_length=1)
    context_chunk_ids: list[str] = Field(default_factory=list)


class GenerateResponse(BaseModel):
    answer: str
    sources: list[str]
