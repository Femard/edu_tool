from pathlib import Path

import structlog

from core.config import Settings
from ingestion.chunker import chunk_text
from ingestion.metadata_validator import DocumentMetadata
from ingestion.mcp_mock import MockDocument, fetch_mock_documents
from ingestion.pdf_reader import extract_pages
from search.vector_store import get_index

log = structlog.get_logger()


def ingest_pdf(pdf_path: Path, raw_metadata: dict, settings: Settings) -> int:
    """Ingest a PDF into ChromaDB. Returns number of chunks stored.

    Raises:
        ValueError: if metadata is invalid or the PDF has no readable text.
    """
    raw_metadata = dict(raw_metadata)
    raw_metadata["filename"] = pdf_path.name

    index = get_index(settings)
    chunks_stored = 0

    for page_num, text in extract_pages(pdf_path):
        raw_metadata["page_number"] = page_num
        validated = DocumentMetadata(**raw_metadata)  # raises ValueError on bad metadata
        nodes = chunk_text(text, validated.model_dump(), settings)
        index.insert_nodes(nodes)
        chunks_stored += len(nodes)
        log.info("page_ingested", filename=pdf_path.name, page=page_num, chunks=len(nodes))

    log.info("pdf_ingested", filename=pdf_path.name, total_chunks=chunks_stored)
    return chunks_stored


def ingest_mock_documents(settings: Settings) -> int:
    """Ingest the MCP mock documents into ChromaDB. Returns number of chunks stored."""
    index = get_index(settings)
    total = 0

    for doc in fetch_mock_documents():
        validated = DocumentMetadata(**doc.metadata)
        nodes = chunk_text(doc.content, validated.model_dump(), settings)
        index.insert_nodes(nodes)
        total += len(nodes)
        log.info(
            "mock_doc_ingested",
            filename=doc.metadata["filename"],
            chunks=len(nodes),
        )

    log.info("mock_ingestion_complete", total_chunks=total)
    return total
