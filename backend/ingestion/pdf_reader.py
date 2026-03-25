from pathlib import Path
from typing import Iterator

import pdfplumber
import structlog

log = structlog.get_logger()


def extract_pages(pdf_path: Path) -> Iterator[tuple[int, str]]:
    """Yields (page_number, text) for each readable page of a PDF.

    Skips blank pages and logs warnings on extraction failures.
    Raises ValueError if the PDF yields zero readable pages.
    """
    try:
        with pdfplumber.open(pdf_path) as pdf:
            readable_pages = 0
            for i, page in enumerate(pdf.pages):
                try:
                    text = page.extract_text()
                    if text and text.strip():
                        readable_pages += 1
                        yield i + 1, text.strip()
                    else:
                        log.warning("empty_page", path=str(pdf_path), page=i + 1)
                except Exception as exc:
                    log.warning(
                        "page_extraction_failed",
                        path=str(pdf_path),
                        page=i + 1,
                        error=str(exc),
                    )

            if readable_pages == 0:
                raise ValueError(
                    f"No readable text found in '{pdf_path.name}'. "
                    "The file may be a scanned image PDF. "
                    "Please provide a text-based PDF."
                )

    except pdfplumber.exceptions.PDFSyntaxError as exc:
        log.error("invalid_pdf", path=str(pdf_path), error=str(exc))
        raise ValueError(f"Cannot open '{pdf_path.name}': not a valid PDF.") from exc
