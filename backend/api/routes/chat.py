import structlog
from fastapi import APIRouter, HTTPException
from llama_index.core.llms import ChatMessage, MessageRole
from llama_index.core.vector_stores import ExactMatchFilter, FilterCondition, MetadataFilters
from llama_index.llms.ollama import Ollama

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


def _search_library(
    query: str, settings: Settings, selected_files: list[str], top_k: int = 5
) -> tuple[list[str], list[str]]:
    """Returns (context_parts, sources)."""
    index = get_index(settings)
    filters = _build_file_filters(selected_files)
    retriever = index.as_retriever(similarity_top_k=top_k, filters=filters)
    nodes = retriever.retrieve(query)
    context_parts = [n.text for n in nodes]
    sources = list({n.metadata.get("filename", "") for n in nodes if n.metadata.get("filename")})
    return context_parts, sources


def _search_web(query: str) -> tuple[list[str], list[str]]:
    """Returns (context_parts, sources)."""
    results = web_search(query, max_results=5)
    context_parts = [f"{r.title}\n{r.snippet}" for r in results]
    sources = [r.url for r in results]
    return context_parts, sources


async def _generate(
    message: str,
    context_parts: list[str],
    settings: Settings,
) -> str:
    context = "\n\n---\n\n".join(context_parts) if context_parts else "Aucun contexte disponible."
    user_content = f"Contexte :\n{context}\n\nQuestion du professeur : {message}"

    llm = Ollama(
        model=settings.ollama_model,
        base_url=settings.ollama_base_url,
        request_timeout=90.0,
    )
    messages = [
        ChatMessage(role=MessageRole.SYSTEM, content=SYSTEM_PROMPT),
        ChatMessage(role=MessageRole.USER, content=user_content),
    ]
    try:
        response = await llm.achat(messages)
    except Exception as exc:
        log.error("ollama_chat_error", error=str(exc))
        raise HTTPException(status_code=503, detail=f"Erreur Ollama : {exc}") from exc

    return response.message.content or ""


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    settings = Settings()
    context_parts: list[str] = []
    sources: list[str] = []
    mode_used = "none"

    if request.mode == "library":
        context_parts, sources = _search_library(
            request.message, settings, request.selected_files
        )
        mode_used = "library"

    elif request.mode == "web":
        context_parts, sources = _search_web(request.message)
        mode_used = "web"

    else:  # auto
        context_parts, sources = _search_library(
            request.message, settings, request.selected_files
        )
        if context_parts:
            mode_used = "library"
        else:
            log.info("auto_fallback_web", message=request.message)
            context_parts, sources = _search_web(request.message)
            mode_used = "web" if context_parts else "none"

    answer = await _generate(request.message, context_parts, settings)
    return ChatResponse(answer=answer, sources=sources, mode_used=mode_used)
