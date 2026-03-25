"use client";

import { useState } from "react";
import { webSearch } from "@/lib/api";
import type { WebSearchResult } from "@/lib/types";

export function useWebSearch() {
  const [results, setResults] = useState<WebSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  async function search(q: string) {
    setLoading(true);
    setError(null);
    setQuery(q);
    try {
      const data = await webSearch(q);
      setResults(data.results);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de recherche web");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return { results, loading, error, query, search };
}
