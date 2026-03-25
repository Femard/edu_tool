"""Client MCP pour data.gouv.fr (serveur Streamable HTTP public).

Remplace mcp_mock.py pour les requêtes en production.
L'endpoint /ingest/mock reste inchangé (il importe directement depuis mcp_mock).

Note : le serveur renvoie du texte formaté (pas du JSON).
"""

from __future__ import annotations

import asyncio
import re
from dataclasses import dataclass, field
from typing import Any

import structlog
from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client

from core.config import Settings

log = structlog.get_logger()


class MCPGouvError(Exception):
    """Erreur réseau ou protocole lors de l'appel au MCP data.gouv.fr."""


@dataclass
class GovResource:
    id: str
    title: str
    url: str
    format: str
    description: str = ""


@dataclass
class GovDataset:
    id: str
    title: str
    organization: str
    description: str
    resources: list[GovResource] = field(default_factory=list)


async def _call_tool(
    settings: Settings, tool: str, args: dict[str, Any]
) -> tuple[str, bool]:
    """Ouvre une session MCP, appelle un outil. Retourne (text, isError)."""
    async with streamablehttp_client(settings.mcp_gouv_url) as (read, write, _):
        async with ClientSession(read, write) as session:
            await session.initialize()
            result = await session.call_tool(tool, args)
            text = getattr(result.content[0], "text", "") if result.content else ""
            return text or "", bool(result.isError)


def _parse_datasets_text(text: str, max_results: int) -> list[GovDataset]:
    """Parse la réponse texte formatée du MCP search_datasets.

    Format attendu :
        1. <Titre>
           ID: <id>
           Organization: <org>
           Tags: <tag1>, <tag2>
           Resources: N
           URL: <url>
    """
    datasets: list[GovDataset] = []

    # Découpe en blocs numérotés ("1. ", "2. ", …)
    blocks = re.split(r"\n(?=\d+\. )", text)

    for block in blocks:
        if not re.match(r"^\d+\. ", block):
            continue

        lines = block.strip().splitlines()
        title_match = re.match(r"^\d+\. (.+)$", lines[0])
        if not title_match:
            continue
        title = title_match.group(1).strip()

        dataset_id = organization = tags_str = ""
        for line in lines[1:]:
            line = line.strip()
            if line.startswith("ID: "):
                dataset_id = line[4:].strip()
            elif line.startswith("Organization: "):
                organization = line[14:].strip()
            elif line.startswith("Tags: "):
                tags_str = line[6:].strip()

        if not dataset_id:
            continue

        datasets.append(GovDataset(
            id=dataset_id,
            title=title,
            organization=organization,
            description=tags_str[:300],
        ))

        if len(datasets) >= max_results:
            break

    return datasets


def _parse_resources_text(text: str) -> list[GovResource]:
    """Parse la réponse texte formatée du MCP list_dataset_resources.

    Tente d'abord le format numéroté, puis cherche des lignes URL/Format.
    """
    resources: list[GovResource] = []
    blocks = re.split(r"\n(?=\d+\. )", text)

    for block in blocks:
        if not re.match(r"^\d+\. ", block):
            continue

        lines = block.strip().splitlines()
        title_match = re.match(r"^\d+\. (.+)$", lines[0])
        if not title_match:
            continue
        title = title_match.group(1).strip()

        resource_id = url = fmt = description = ""
        for line in lines[1:]:
            line = line.strip()
            if line.startswith("ID: "):
                resource_id = line[4:].strip()
            elif line.startswith("URL: "):
                url = line[5:].strip()
            elif line.startswith("Format: ") or line.startswith("Type: "):
                fmt = line.split(":", 1)[1].strip().upper()
            elif line.startswith("Description: "):
                description = line[13:].strip()

        if resource_id or url:
            resources.append(GovResource(
                id=resource_id,
                title=title,
                url=url,
                format=fmt,
                description=description[:200],
            ))

    return resources


async def search_datasets(
    query: str, settings: Settings, max_results: int = 8
) -> list[GovDataset]:
    """Recherche des datasets sur data.gouv.fr via MCP."""
    try:
        raw_text, is_error = await asyncio.wait_for(
            _call_tool(settings, "search_datasets", {"query": query, "page_size": max_results}),
            timeout=settings.mcp_gouv_timeout,
        )
    except asyncio.TimeoutError as exc:
        raise MCPGouvError("MCP timeout lors de la recherche") from exc
    except Exception as exc:
        raise MCPGouvError(f"MCP inaccessible : {exc}") from exc

    log.info("mcp_search_raw", is_error=is_error, chars=len(raw_text), preview=raw_text[:200])

    if is_error or not raw_text.strip():
        return []

    datasets = _parse_datasets_text(raw_text, max_results)
    log.info("mcp_search_done", query=query, count=len(datasets))
    return datasets


async def get_dataset_resources(
    dataset_id: str, settings: Settings
) -> list[GovResource]:
    """Récupère la liste des ressources (fichiers) d'un dataset."""
    try:
        raw_text, is_error = await asyncio.wait_for(
            _call_tool(settings, "list_dataset_resources", {"dataset_id": dataset_id}),
            timeout=settings.mcp_gouv_timeout,
        )
    except asyncio.TimeoutError as exc:
        raise MCPGouvError("MCP timeout lors de la récupération des ressources") from exc
    except Exception as exc:
        raise MCPGouvError(f"MCP inaccessible : {exc}") from exc

    log.info("mcp_resources_raw", dataset_id=dataset_id, is_error=is_error, preview=raw_text[:200])

    if is_error or not raw_text.strip():
        return []

    return _parse_resources_text(raw_text)


async def download_resource_text(resource: GovResource, settings: Settings) -> str:
    """Télécharge et extrait le texte d'une ressource gouvernementale.

    Essaie d'abord download_and_parse_resource via MCP (retourne du texte brut).
    Fallback sur url_ingester si le MCP échoue ou renvoie trop peu de texte.
    """
    # Tentative 1 : MCP natif
    try:
        raw_text, is_error = await asyncio.wait_for(
            _call_tool(settings, "download_and_parse_resource", {"resource_id": resource.id}),
            timeout=settings.mcp_gouv_timeout,
        )
        if not is_error and len(raw_text.strip()) > 100:
            log.info("mcp_resource_parsed", resource_id=resource.id, chars=len(raw_text))
            return raw_text
    except Exception as exc:
        log.warning("mcp_parse_failed_fallback", resource_id=resource.id, error=str(exc))

    # Tentative 2 : url_ingester (gère PDF + HTML)
    if not resource.url:
        raise MCPGouvError(f"Aucune URL pour la ressource {resource.id}")

    from ingestion.url_ingester import fetch_and_extract
    loop = asyncio.get_event_loop()
    text, _ = await loop.run_in_executor(None, fetch_and_extract, resource.url)
    return text
