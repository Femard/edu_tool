import type { ChatMode, ChatResponse, DocumentInfo, GenerateResponse, GovResource, GovSearchResponse, SearchFilters, SearchResponse, SSEEvent, WebSearchResponse } from "./types";

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

export async function deleteDocument(filename: string): Promise<number> {
  const res = await fetch(`${API_BASE}/api/v1/documents/${encodeURIComponent(filename)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Erreur ${res.status} : ${detail}`);
  }
  const data = await res.json() as { deleted_chunks: number };
  return data.deleted_chunks;
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

export interface IngestUrlMeta {
  cycle: string;
  niveau: string;
  domaine: string;
  type_ressource: string;
}

export async function govSearch(q: string, maxResults = 12, source: "all" | "eduscol" = "all"): Promise<GovSearchResponse> {
  const params = new URLSearchParams({ q, max_results: String(maxResults), source });
  const res = await fetch(`${API_BASE}/api/v1/gouv/search?${params.toString()}`);
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Erreur ${res.status} : ${detail}`);
  }
  return res.json() as Promise<GovSearchResponse>;
}

export interface GovIngestMeta {
  cycle: string;
  niveau: string;
  domaine: string;
  type_ressource: string;
}

export async function govGetResources(datasetId: string): Promise<GovResource[]> {
  const res = await fetch(`${API_BASE}/api/v1/gouv/resources/${encodeURIComponent(datasetId)}`);
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Erreur ${res.status} : ${detail}`);
  }
  return res.json() as Promise<GovResource[]>;
}

export async function govIngest(
  datasetId: string,
  resource: GovResource,
  meta: GovIngestMeta,
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/gouv/ingest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      dataset_id: datasetId,
      resource_id: resource.id,
      resource_url: resource.url,
      resource_title: resource.title,
      ...meta,
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Erreur ${res.status} : ${detail}`);
  }
}

export async function* streamChatMessage(
  message: string,
  mode: ChatMode,
  selectedFiles: string[],
): AsyncGenerator<SSEEvent> {
  const res = await fetch(`${API_BASE}/api/v1/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, mode, selected_files: selectedFiles }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Erreur ${res.status} : ${detail}`);
  }
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const raw = line.slice(6).trim();
        if (raw) yield JSON.parse(raw) as SSEEvent;
      }
    }
  }
}

export interface IngestPdfMeta {
  cycle: string;
  niveau: string;
  domaine: string;
  type_ressource: string;
}

export async function ingestPdf(file: File, meta: IngestPdfMeta): Promise<void> {
  const form = new FormData();
  form.append("file", file);
  form.append("cycle", meta.cycle);
  form.append("niveau", meta.niveau);
  form.append("domaine", meta.domaine);
  form.append("type_ressource", meta.type_ressource);
  form.append("source", "Upload_Manuel");
  const res = await fetch(`${API_BASE}/api/v1/ingest`, { method: "POST", body: form });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Erreur ${res.status} : ${detail}`);
  }
}

export async function ingestUrl(url: string, meta: IngestUrlMeta): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/ingest/url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, ...meta }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Erreur ${res.status} : ${detail}`);
  }
}
