from contextlib import asynccontextmanager
from typing import AsyncIterator

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import generate, ingest, search, web_search
from core.logging import configure_logging

configure_logging()
log = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    log.info("startup", service="edu_tool_backend")
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
    allow_origins=["http://localhost:3000", "http://frontend:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search.router, prefix="/api/v1", tags=["search"])
app.include_router(ingest.router, prefix="/api/v1", tags=["ingest"])
app.include_router(generate.router, prefix="/api/v1", tags=["generate"])
app.include_router(web_search.router, prefix="/api/v1", tags=["web-search"])


@app.get("/health", tags=["system"])
async def health() -> dict:
    return {"status": "ok"}
