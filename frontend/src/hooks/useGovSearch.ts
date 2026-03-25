"use client";

import { useState } from "react";
import { govSearch } from "@/lib/api";
import type { GovDataset } from "@/lib/types";

export function useGovSearch() {
  const [results, setResults] = useState<GovDataset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  async function search(q: string, source: "all" | "eduscol" = "all") {
    setLoading(true);
    setError(null);
    setQuery(q);
    try {
      const data = await govSearch(q, 12, source);
      setResults(data.datasets);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur MCP gouvernemental");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return { results, loading, error, query, search };
}
