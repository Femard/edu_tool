from llama_index.core import Document
from llama_index.core.node_parser import SentenceSplitter
from llama_index.core.schema import BaseNode

from core.config import Settings


def chunk_text(text: str, metadata: dict, settings: Settings) -> list[BaseNode]:
    """Split text into overlapping chunks while preserving sentence boundaries."""
    splitter = SentenceSplitter(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
        separator="\n",
    )
    doc = Document(text=text, metadata=metadata)
    return splitter.get_nodes_from_documents([doc])
