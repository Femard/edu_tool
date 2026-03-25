import httpx
import structlog
from fastapi import APIRouter, HTTPException

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

    payload = {
        "model": settings.ollama_model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        "stream": False,
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{settings.ollama_base_url}/api/chat",
                json=payload,
            )
            response.raise_for_status()
    except httpx.ConnectError as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Impossible de joindre Ollama sur {settings.ollama_base_url}. "
                   "Vérifiez qu'Ollama est bien lancé.",
        ) from exc
    except httpx.HTTPStatusError as exc:
        log.error("ollama_error", status=exc.response.status_code, body=exc.response.text)
        raise HTTPException(
            status_code=502,
            detail=f"Erreur Ollama ({exc.response.status_code}) : {exc.response.text}",
        ) from exc

    data = response.json()
    answer: str = data.get("message", {}).get("content", "")
    return GenerateResponse(answer=answer, sources=sources)
