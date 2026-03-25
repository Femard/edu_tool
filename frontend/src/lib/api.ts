import type { SearchFilters, SearchResponse, WebSearchResponse } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function searchDocuments(
  query: string,
  filters: SearchFilters
): Promise<SearchResponse> {
  const params = new URLSearchParams({ q: query });
  if (filters.cycle) params.set("cycle", filters.cycle);
  if (filters.niveau) params.set("niveau", filters.niveau);
  if (filters.domaine) params.set("domaine", filters.domaine);
  if (filters.type_ressource) params.set("type_ressource", filters.type_ressource);

  const res = await fetch(`${API_BASE}/api/v1/search?${params.toString()}`);
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Erreur ${res.status} : ${detail}`);
  }
  return res.json() as Promise<SearchResponse>;
}

export async function webSearch(q: string, maxResults = 8): Promise<WebSearchResponse> {
  const params = new URLSearchParams({ q, max_results: String(maxResults) });
  const res = await fetch(`${API_BASE}/api/v1/web-search?${params.toString()}`);
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Erreur ${res.status} : ${detail}`);
  }
  return res.json() as Promise<WebSearchResponse>;
}

export async function ingestUrl(
  url: string,
  cycle?: string,
  domaine?: string,
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/ingest/url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, cycle, domaine }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Erreur ${res.status} : ${detail}`);
  }
}
