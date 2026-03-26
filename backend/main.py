from contextlib import asynccontextmanager
from typing import AsyncIterator

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from llama_index.core import Settings as LlamaSettings
from llama_index.embeddings.ollama import OllamaEmbedding
from llama_index.llms.mistralai import MistralAI

from api.routes import chat, documents, generate, gouv, ingest, search, web_search
from core.config import Settings
from core.logging import configure_logging

configure_logging()
log = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = Settings()
    LlamaSettings.llm = MistralAI(
        model=settings.mistral_model,
        api_key=settings.mistral_api_key,
        max_tokens=4096,
    )
    LlamaSettings.embed_model = OllamaEmbedding(
        model_name=settings.ollama_embedding_model,
        base_url=settings.ollama_base_url,
    )
    log.info("startup", service="edu_tool_backend", llm=settings.mistral_model)
    yield
    log.info("shutdown", service="edu_tool_backend")


app = FastAPI(
    title="EduTool RAG API",
    description="Moteur de recherche pédagogique RAG pour professeurs des écoles",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=Settings().cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search.router, prefix="/api/v1", tags=["search"])
app.include_router(ingest.router, prefix="/api/v1", tags=["ingest"])
app.include_router(generate.router, prefix="/api/v1", tags=["generate"])
app.include_router(web_search.router, prefix="/api/v1", tags=["web-search"])
app.include_router(chat.router, prefix="/api/v1", tags=["chat"])
app.include_router(documents.router, prefix="/api/v1", tags=["documents"])
app.include_router(gouv.router, prefix="/api/v1", tags=["gouv"])


@app.get("/health", tags=["system"])
async def health() -> dict:
    return {"status": "ok"}
