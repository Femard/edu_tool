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
