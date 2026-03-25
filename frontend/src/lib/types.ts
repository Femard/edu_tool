export interface DocumentMetadata {
  cycle: string;
  niveau: string;
  domaine: string;
  type_ressource: string;
  source: string;
  filename: string;
  page_number: number;
}

export interface SearchResult {
  score: number;
  text: string;
  metadata: DocumentMetadata;
  chunk_id: string;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
}

export interface SearchFilters {
  cycle?: string;
  niveau?: string;
  domaine?: string;
  type_ressource?: string;
}

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface WebSearchResponse {
  results: WebSearchResult[];
  query: string;
}

export type IngestStatus = "idle" | "loading" | "success" | "error";

export interface GenerateResponse {
  answer: string;
  sources: string[];
}

export interface DocumentInfo {
  filename: string;
  source: string;
  cycle: string;
  domaine: string;
}

export type ChatMode = "auto" | "library" | "web";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  modeUsed?: "library" | "web" | "none";
}

export interface ChatResponse {
  answer: string;
  sources: string[];
  mode_used: string;
}

export interface GovResource {
  id: string;
  title: string;
  url: string;
  format: string;
  description: string;
}

export interface GovDataset {
  id: string;
  title: string;
  organization: string;
  description: string;
  resources: GovResource[];
}

export interface GovSearchResponse {
  datasets: GovDataset[];
  query: string;
}

export type SSEEvent =
  | { type: "meta"; sources: string[]; mode_used: string }
  | { type: "token"; text: string }
  | { type: "error"; message: string }
  | { type: "done" };
