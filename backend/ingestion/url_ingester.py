import tempfile
from pathlib import Path
from urllib.parse import urlparse

import httpx
import structlog
from bs4 import BeautifulSoup

from ingestion.pdf_reader import extract_pages

log = structlog.get_logger()

_HEADERS = {"User-Agent": "EduTool/1.0 (ressources pédagogiques)"}


def fetch_and_extract(url: str) -> tuple[str, str]:
    """Download URL and extract plain text.

    Returns:
        (text, doc_type) where doc_type is 'pdf' or 'html'.

    Raises:
        httpx.HTTPError: on network/HTTP errors.
        ValueError: if no readable text could be extracted.
    """
    with httpx.Client(follow_redirects=True, timeout=30) as client:
        resp = client.get(url, headers=_HEADERS)
        resp.raise_for_status()

    content_type = resp.headers.get("content-type", "")

    if "application/pdf" in content_type or url.lower().split("?")[0].endswith(".pdf"):
        return _extract_pdf(resp.content)

    return _extract_html(resp.text)


def _extract_pdf(content: bytes) -> tuple[str, str]:
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(content)
        tmp_path = Path(tmp.name)
    try:
        pages_text = [text for _, text in extract_pages(tmp_path)]
    finally:
        tmp_path.unlink(missing_ok=True)

    full_text = "\n".join(pages_text)
    if not full_text.strip():
        raise ValueError("Le PDF ne contient pas de texte lisible (PDF scanné ?)")
    return full_text, "pdf"


def _extract_html(html: str) -> tuple[str, str]:
    soup = BeautifulSoup(html, "lxml")
    for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
        tag.decompose()
    text = soup.get_text(separator="\n", strip=True)
    if not text.strip():
        raise ValueError("La page HTML ne contient pas de texte extractible")
    return text, "html"


def filename_from_url(url: str) -> str:
    path = urlparse(url).path
    name = path.split("/")[-1] or "page_web"
    return name[:100]  # limite la longueur
