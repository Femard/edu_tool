import structlog
from fastapi import APIRouter, HTTPException
from llama_index.core import Settings as LlamaSettings
from llama_index.core.llms import ChatMessage, MessageRole

from api.schemas import GenerateRequest, GenerateResponse
from core.config import Settings
from search.vector_store import get_index

log = structlog.get_logger()
router = APIRouter()

SYSTEM_PROMPT = (
    "Tu es un assistant pédagogique pour des professeurs des écoles français. "
    "À partir des extraits de ressources fournis, réponds de manière concise et utile. "
    "Si les extraits ne contiennent pas l'information demandée, dis-le clairement."
)


@router.post("/generate", response_model=GenerateResponse)
async def generate_answer(request: GenerateRequest) -> GenerateResponse:
    settings = Settings()
    index = get_index(settings)

    # Fetch context chunks
    context_parts: list[str] = []
    sources: list[str] = []

    if request.context_chunk_ids:
        docstore = index.storage_context.docstore
        for chunk_id in request.context_chunk_ids:
            node = docstore.get_node(chunk_id, raise_error=False)
            if node:
                context_parts.append(node.text)
                filename = node.metadata.get("filename", "")
                if filename and filename not in sources:
                    sources.append(filename)
    else:
        retriever = index.as_retriever(similarity_top_k=5)
        nodes = retriever.retrieve(request.query)
        context_parts = [n.text for n in nodes]
        sources = list(
            {n.metadata.get("filename", "") for n in nodes if n.metadata.get("filename")}
        )

    context = "\n\n---\n\n".join(context_parts)
    user_message = f"Extraits de ressources :\n{context}\n\nQuestion : {request.query}"

    messages = [
        ChatMessage(role=MessageRole.SYSTEM, content=SYSTEM_PROMPT),
        ChatMessage(role=MessageRole.USER, content=user_message),
    ]

    try:
        response = await LlamaSettings.llm.achat(messages)
    except Exception as exc:
        log.error("ollama_generate_error", error=str(exc))
        raise HTTPException(status_code=503, detail=f"Erreur Ollama : {exc}") from exc

    answer: str = response.message.content or ""
    return GenerateResponse(answer=answer, sources=sources)
