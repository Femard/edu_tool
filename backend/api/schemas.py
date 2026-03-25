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


class DocumentInfo(BaseModel):
    filename: str
    source: str
    cycle: str
    domaine: str


class DocumentListResponse(BaseModel):
    documents: list[DocumentInfo]


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    mode: str = Field(default="auto", pattern="^(auto|library|web)$")
    selected_files: list[str] = Field(default_factory=list)


class ChatResponse(BaseModel):
    answer: str
    sources: list[str]
    mode_used: str  # "library" | "web" | "none"


class WebSearchResult(BaseModel):
    title: str
    url: str
    snippet: str


class WebSearchResponse(BaseModel):
    results: list[WebSearchResult]
    query: str


class IngestUrlRequest(BaseModel):
    url: str
    cycle: str
    niveau: str
    domaine: str
    type_ressource: str
    source: str = "Web_Curate"


class IngestUrlResponse(BaseModel):
    status: str
    message: str
    url: str


# --- Gov MCP schemas ---

class GovResourceSchema(BaseModel):
    id: str
    title: str
    url: str
    format: str
    description: str


class GovDatasetSchema(BaseModel):
    id: str
    title: str
    organization: str
    description: str
    resources: list[GovResourceSchema] = []


class GovSearchResponse(BaseModel):
    datasets: list[GovDatasetSchema]
    query: str


class GovIngestRequest(BaseModel):
    dataset_id: str
    resource_id: str
    resource_url: str
    resource_title: str
    cycle: str
    niveau: str
    domaine: str
    type_ressource: str


class GovIngestResponse(BaseModel):
    status: str
    message: str
    resource_id: str
