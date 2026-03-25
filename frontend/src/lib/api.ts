import type { SearchFilters, SearchResponse } from "./types";

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
