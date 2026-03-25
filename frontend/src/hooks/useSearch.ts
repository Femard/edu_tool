"use client";

import { useCallback, useState } from "react";
import { searchDocuments } from "@/lib/api";
import type { SearchFilters, SearchResult } from "@/lib/types";

export function useSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const search = useCallback(async (q: string, filters: SearchFilters) => {
    setLoading(true);
    setError(null);
    setQuery(q);
    try {
      const data = await searchDocuments(q, filters);
      setResults(data.results);
    } catch (e) {
      setError(e instanceof Error ? e.message : "La recherche a échoué.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, error, query, search };
}
