"use client";

import { useState } from "react";
import { FilterPanel } from "@/components/FilterPanel";
import { ResultList } from "@/components/ResultList";
import { SearchBar } from "@/components/SearchBar";
import { useSearch } from "@/hooks/useSearch";
import type { SearchFilters } from "@/lib/types";

export default function HomePage() {
  const [filters, setFilters] = useState<SearchFilters>({});
  const { results, loading, error, query, search } = useSearch();

  const handleSearch = (q: string) => search(q, filters);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="flex flex-col items-center pt-20 pb-16 px-4 gap-6">
        {/* Header */}
        <div className="text-center mb-2">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Ressources Pédagogiques
          </h1>
          <p className="text-gray-500 text-sm">
            Trouvez exercices, leçons et fiches de préparation en quelques secondes
          </p>
        </div>

        {/* Search */}
        <SearchBar onSearch={handleSearch} loading={loading} />

        {/* Filters */}
        <FilterPanel filters={filters} onChange={setFilters} />

        {/* Error */}
        {error && (
          <div className="w-full max-w-2xl p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="text-gray-400 text-sm animate-pulse">
            Recherche en cours…
          </div>
        )}

        {/* Empty state after a search */}
        {!loading && query && results.length === 0 && !error && (
          <div className="text-gray-400 text-sm">
            Aucun résultat pour « {query} ». Essayez des mots-clés différents ou élargissez les filtres.
          </div>
        )}

        {/* Results */}
        {!loading && <ResultList results={results} query={query} />}
      </div>
    </main>
  );
}
