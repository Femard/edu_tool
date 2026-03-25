import type { ChatMode, ChatResponse, DocumentInfo, GenerateResponse, SearchFilters, SearchResponse, WebSearchResponse } from "./types";

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

export async function generateExercice(
  query: string,
  chunkId: string,
): Promise<GenerateResponse> {
  const res = await fetch(`${API_BASE}/api/v1/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, context_chunk_ids: [chunkId] }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Erreur ${res.status} : ${detail}`);
  }
  return res.json() as Promise<GenerateResponse>;
}

export async function getDocuments(): Promise<DocumentInfo[]> {
  const res = await fetch(`${API_BASE}/api/v1/documents`);
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  const data = await res.json() as { documents: DocumentInfo[] };
  return data.documents;
}

export async function sendChatMessage(
  message: string,
  mode: ChatMode,
  selectedFiles: string[],
): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/api/v1/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, mode, selected_files: selectedFiles }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Erreur ${res.status} : ${detail}`);
  }
  return res.json() as Promise<ChatResponse>;
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
