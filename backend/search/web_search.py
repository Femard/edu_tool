import structlog
import httpx

from api.schemas import WebSearchResult
from core.config import Settings

log = structlog.get_logger()

TRUSTED_SITES = [
    "eduscol.education.fr",
    "boutdegomme.fr",
    "reseau-canope.fr",
    "pedagogie.ac-toulouse.fr",
    "maitressenadege.com",
    "ekladata.com",
    "laclassedemallory.com",
]


def web_search(query: str, max_results: int = 8) -> list[WebSearchResult]:
    site_filter = " OR ".join(f"site:{s}" for s in TRUSTED_SITES)
    full_query = f"{query} {site_filter}"
    log.info("web_search_start", query=full_query)

    settings = Settings()
    params = {
        "q": full_query,
        "format": "json",
        "pageno": 1,
    }

    with httpx.Client(timeout=15) as client:
        resp = client.get(f"{settings.searxng_url}/search", params=params)
        resp.raise_for_status()
        data = resp.json()

    results = [
        WebSearchResult(
            title=r.get("title", ""),
            url=r.get("url", ""),
            snippet=r.get("content", ""),
        )
        for r in data.get("results", [])[:max_results]
    ]

    log.info("web_search_done", count=len(results))
    return results
