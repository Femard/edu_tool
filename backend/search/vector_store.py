from functools import lru_cache

import chromadb
from chromadb.config import Settings as ChromaSettings
from llama_index.core import StorageContext, VectorStoreIndex
from llama_index.embeddings.ollama import OllamaEmbedding
from llama_index.vector_stores.chroma import ChromaVectorStore

from core.config import Settings


@lru_cache(maxsize=1)
def _get_chroma_client(persist_dir: str) -> chromadb.ClientAPI:
    return chromadb.PersistentClient(
        path=persist_dir,
        settings=ChromaSettings(anonymized_telemetry=False),
    )


@lru_cache(maxsize=1)
def _get_embed_model(base_url: str, model_name: str) -> OllamaEmbedding:
    return OllamaEmbedding(model_name=model_name, base_url=base_url)


def get_document_list(settings: Settings) -> list[dict]:
    """Return one metadata dict per unique filename in the collection."""
    client = _get_chroma_client(settings.chroma_persist_dir)
    try:
        collection = client.get_collection(settings.collection_name)
    except Exception:
        return []
    result = collection.get(include=["metadatas"])
    seen: set[str] = set()
    docs: list[dict] = []
    for meta in result.get("metadatas") or []:
        fname = meta.get("filename", "")
        if fname and fname not in seen:
            seen.add(fname)
            docs.append(meta)
    return docs


def get_index(settings: Settings) -> VectorStoreIndex:
    """Return a LlamaIndex VectorStoreIndex backed by ChromaDB."""
    client = _get_chroma_client(settings.chroma_persist_dir)
    collection = client.get_or_create_collection(settings.collection_name)
    vector_store = ChromaVectorStore(chroma_collection=collection)
    storage_context = StorageContext.from_defaults(vector_store=vector_store)
    embed_model = _get_embed_model(settings.ollama_base_url, settings.ollama_embedding_model)

    return VectorStoreIndex.from_vector_store(
        vector_store,
        storage_context=storage_context,
        embed_model=embed_model,
    )
