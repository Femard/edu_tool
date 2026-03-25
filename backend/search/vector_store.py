from functools import lru_cache

import chromadb
from chromadb.config import Settings as ChromaSettings
from llama_index.core import StorageContext, VectorStoreIndex
from llama_index.vector_stores.chroma import ChromaVectorStore

from core.config import Settings


@lru_cache(maxsize=1)
def _get_chroma_client(persist_dir: str) -> chromadb.ClientAPI:
    return chromadb.PersistentClient(
        path=persist_dir,
        settings=ChromaSettings(anonymized_telemetry=False),
    )


def delete_document(filename: str, settings: Settings) -> int:
    """Delete all chunks for a given filename. Returns number of deleted chunks."""
    client = _get_chroma_client(settings.chroma_persist_dir)
    try:
        collection = client.get_collection(settings.collection_name)
    except Exception:
        return 0
    existing = collection.get(where={"filename": filename}, include=[])
    count = len(existing.get("ids") or [])
    if count > 0:
        collection.delete(where={"filename": filename})
    return count


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

    return VectorStoreIndex.from_vector_store(
        vector_store,
        storage_context=storage_context,
    )
