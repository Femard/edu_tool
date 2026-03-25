import json

import structlog
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from llama_index.core import Settings as LlamaSettings
from llama_index.core.llms import ChatMessage, MessageRole
from llama_index.core.vector_stores import ExactMatchFilter, FilterCondition, MetadataFilters

from api.schemas import ChatRequest, ChatResponse
from core.config import Settings
from search.vector_store import get_index
from search.web_search import web_search

log = structlog.get_logger()
router = APIRouter()

SYSTEM_PROMPT = (
    "Tu es un assistant pédagogique expert pour des professeurs des écoles français. "
    "Réponds de manière claire, concise et pratique. "
    "Si le contexte fourni ne contient pas l'information, dis-le honnêtement."
)


def _build_file_filters(selected_files: list[str]) -> MetadataFilters | None:
    if not selected_files:
        return None
    return MetadataFilters(
        filters=[ExactMatchFilter(key="filename", value=f) for f in selected_files],
        condition=FilterCondition.OR,
    )


def _get_context(
    request: ChatRequest, settings: Settings
) -> tuple[list[str], list[str], str]:
    """Returns (context_parts, sources, mode_used)."""
    if request.mode == "library":
        parts, sources = _search_library(request.message, settings, request.selected_files)
        return parts, sources, "library"

    if request.mode == "web":
        parts, sources = _search_web(request.message)
        return parts, sources, "web" if parts else "none"

    # auto
    parts, sources = _search_library(request.message, settings, request.selected_files)
    if parts:
        return parts, sources, "library"
    log.info("auto_fallback_web", message=request.message)
    parts, sources = _search_web(request.message)
    return parts, sources, "web" if parts else "none"


def _search_library(
    query: str, settings: Settings, selected_files: list[str], top_k: int = 5
) -> tuple[list[str], list[str]]:
    index = get_index(settings)
    filters = _build_file_filters(selected_files)
    retriever = index.as_retriever(similarity_top_k=top_k, filters=filters)
    nodes = retriever.retrieve(query)
    parts = [n.text for n in nodes]
    sources = list({n.metadata.get("filename", "") for n in nodes if n.metadata.get("filename")})
    return parts, sources


def _search_web(query: str) -> tuple[list[str], list[str]]:
    results = web_search(query, max_results=5)
    parts = [f"{r.title}\n{r.snippet}" for r in results]
    sources = [r.url for r in results]
    return parts, sources


def _build_messages(message: str, context_parts: list[str]) -> list[ChatMessage]:
    context = "\n\n---\n\n".join(context_parts) if context_parts else "Aucun contexte disponible."
    return [
        ChatMessage(role=MessageRole.SYSTEM, content=SYSTEM_PROMPT),
        ChatMessage(
            role=MessageRole.USER,
            content=f"Contexte :\n{context}\n\nQuestion du professeur : {message}",
        ),
    ]


# ── Non-streaming (kept for compatibility) ────────────────────────────────────

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    settings = Settings()
    context_parts, sources, mode_used = _get_context(request, settings)
    messages = _build_messages(request.message, context_parts)

    try:
        response = await LlamaSettings.llm.achat(messages)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Erreur Ollama : {exc}") from exc

    return ChatResponse(answer=response.message.content or "", sources=sources, mode_used=mode_used)


# ── Streaming (SSE) ────────────────────────────────────────────────────────────

async def _sse_stream(request: ChatRequest, settings: Settings):
    """Async generator yielding SSE-formatted events."""
    context_parts, sources, mode_used = _get_context(request, settings)

    # Send metadata before first token
    yield f"data: {json.dumps({'type': 'meta', 'sources': sources, 'mode_used': mode_used}, ensure_ascii=False)}\n\n"

    messages = _build_messages(request.message, context_parts)

    try:
        async for chunk in await LlamaSettings.llm.astream_chat(messages):
            delta = chunk.delta or ""
            if delta:
                yield f"data: {json.dumps({'type': 'token', 'text': delta}, ensure_ascii=False)}\n\n"
    except Exception as exc:
        log.error("stream_chat_error", error=str(exc))
        yield f"data: {json.dumps({'type': 'error', 'message': str(exc)}, ensure_ascii=False)}\n\n"

    yield 'data: {"type": "done"}\n\n'


@router.post("/chat/stream")
async def chat_stream(request: ChatRequest) -> StreamingResponse:
    settings = Settings()
    return StreamingResponse(
        _sse_stream(request, settings),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
