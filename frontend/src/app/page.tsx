"use client";

import { useState } from "react";
import { FilterPanel } from "@/components/FilterPanel";
import { ResultList } from "@/components/ResultList";
import { SearchBar } from "@/components/SearchBar";
import { WebResultCard } from "@/components/WebResultCard";
import { useSearch } from "@/hooks/useSearch";
import { useWebSearch } from "@/hooks/useWebSearch";
import type { SearchFilters } from "@/lib/types";

type Tab = "web" | "library";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>("library");

  // Onglet Bibliothèque
  const [filters, setFilters] = useState<SearchFilters>({});
  const { results, loading, error, query, search } = useSearch();
  const handleSearch = (q: string) => search(q, filters);

  // Onglet Web
  const {
    results: webResults,
    loading: webLoading,
    error: webError,
    query: webQuery,
    search: webSearch,
  } = useWebSearch();

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="flex flex-col items-center pt-16 pb-16 px-4 gap-6">

        {/* Header */}
        <div className="text-center mb-2">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Ressources Pédagogiques
          </h1>
          <p className="text-gray-500 text-sm">
            Trouvez exercices, leçons et fiches de préparation en quelques secondes
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-white border border-gray-200 rounded-xl p-1">
          <button
            onClick={() => setActiveTab("web")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "web"
                ? "bg-blue-600 text-white"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            🌐 Explorer le Web
          </button>
          <button
            onClick={() => setActiveTab("library")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "library"
                ? "bg-blue-600 text-white"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            📚 Ma Bibliothèque
          </button>
        </div>

        {/* Onglet : Explorer le Web */}
        {activeTab === "web" && (
          <>
            <SearchBar onSearch={webSearch} loading={webLoading} />

            {webError && (
              <div className="w-full max-w-2xl p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {webError}
              </div>
            )}

            {webLoading && (
              <div className="text-gray-400 text-sm animate-pulse">
                Recherche en cours…
              </div>
            )}

            {!webLoading && webQuery && webResults.length === 0 && !webError && (
              <div className="text-gray-400 text-sm">
                Aucun résultat pour « {webQuery} ». Essayez des mots-clés différents.
              </div>
            )}

            {!webLoading && webResults.length > 0 && (
              <div className="w-full max-w-2xl flex flex-col gap-3">
                <p className="text-xs text-gray-400">
                  {webResults.length} résultats pour « {webQuery} »
                </p>
                {webResults.map((r) => (
                  <WebResultCard key={r.url} result={r} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Onglet : Ma Bibliothèque */}
        {activeTab === "library" && (
          <>
            <SearchBar onSearch={handleSearch} loading={loading} />
            <FilterPanel filters={filters} onChange={setFilters} />

            {error && (
              <div className="w-full max-w-2xl p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {loading && (
              <div className="text-gray-400 text-sm animate-pulse">
                Recherche en cours…
              </div>
            )}

            {!loading && query && results.length === 0 && !error && (
              <div className="text-gray-400 text-sm">
                Aucun résultat pour « {query} ». Essayez des mots-clés différents ou élargissez les filtres.
              </div>
            )}

            {!loading && <ResultList results={results} query={query} />}
          </>
        )}

      </div>
    </main>
  );
}
