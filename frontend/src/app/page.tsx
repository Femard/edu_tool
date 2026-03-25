"use client";

import { useState } from "react";
import { FilterPanel } from "@/components/FilterPanel";
import { ResultList } from "@/components/ResultList";
import { SearchBar } from "@/components/SearchBar";
import { ChatTab } from "@/components/ChatTab";
import { GovDatasetCard } from "@/components/GovDatasetCard";
import { AddToLibrary } from "@/components/AddToLibrary";
import { LibraryManager } from "@/components/LibraryManager";
import { WebResultCard } from "@/components/WebResultCard";
import { useGovSearch } from "@/hooks/useGovSearch";
import { useSearch } from "@/hooks/useSearch";
import { useWebSearch } from "@/hooks/useWebSearch";
import type { SearchFilters } from "@/lib/types";

type Tab = "web" | "gov" | "library" | "chat";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>("library");

  // Onglet Bibliothèque
  const [filters, setFilters] = useState<SearchFilters>({});
  const [libraryView, setLibraryView] = useState<"search" | "manage">("search");
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

  // Onglet Données Gov
  const [govSource, setGovSource] = useState<"all" | "eduscol">("all");
  const {
    results: govResults,
    loading: govLoading,
    error: govError,
    query: govQuery,
    search: govSearchFn,
  } = useGovSearch();
  const govSearch = (q: string) => govSearchFn(q, govSource);

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
            onClick={() => setActiveTab("gov")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "gov"
                ? "bg-blue-600 text-white"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            🏛️ Données Gov
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
          <button
            onClick={() => setActiveTab("chat")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "chat"
                ? "bg-blue-600 text-white"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            🤖 Assistant
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

        {/* Onglet : Données Gov */}
        {activeTab === "gov" && (
          <>
            <div className="flex gap-1">
              {(["all", "eduscol"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setGovSource(s)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    govSource === s
                      ? "bg-blue-600 text-white border-blue-600"
                      : "text-gray-500 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {s === "all" ? "🌐 Tout" : "🎓 Éduscol"}
                </button>
              ))}
            </div>
            <SearchBar onSearch={govSearch} loading={govLoading} />

            {govError && (
              <div className="w-full max-w-2xl p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {govError}
              </div>
            )}

            {govLoading && (
              <div className="text-gray-400 text-sm animate-pulse">
                Recherche dans les données gouvernementales…
              </div>
            )}

            {!govLoading && govQuery && govResults.length === 0 && !govError && (
              <div className="text-gray-400 text-sm">
                Aucun dataset pour « {govQuery} ». Essayez &quot;programmes scolaires primaire&quot;.
              </div>
            )}

            {!govLoading && govResults.length > 0 && (
              <div className="w-full max-w-2xl flex flex-col gap-3">
                <p className="text-xs text-gray-400">
                  {govResults.length} dataset(s) pour « {govQuery} »
                </p>
                {govResults.map((d) => (
                  <GovDatasetCard key={d.id} dataset={d} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Onglet : Assistant */}
        {activeTab === "chat" && <ChatTab />}

        {/* Onglet : Ma Bibliothèque */}
        {activeTab === "library" && (
          <>
            {/* Sous-navigation */}
            <div className="flex gap-1 self-start">
              <button
                onClick={() => setLibraryView("search")}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  libraryView === "search"
                    ? "bg-gray-800 text-white border-gray-800"
                    : "text-gray-500 border-gray-200 hover:border-gray-400"
                }`}
              >
                🔍 Rechercher
              </button>
              <button
                onClick={() => setLibraryView("manage")}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  libraryView === "manage"
                    ? "bg-gray-800 text-white border-gray-800"
                    : "text-gray-500 border-gray-200 hover:border-gray-400"
                }`}
              >
                ⚙️ Gérer
              </button>
            </div>

            {libraryView === "search" && (
              <>
                <SearchBar onSearch={handleSearch} loading={loading} />
                <FilterPanel filters={filters} onChange={setFilters} />

                {error && (
                  <div className="w-full max-w-2xl p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}
                {loading && (
                  <div className="text-gray-400 text-sm animate-pulse">Recherche en cours…</div>
                )}
                {!loading && query && results.length === 0 && !error && (
                  <div className="text-gray-400 text-sm">
                    Aucun résultat pour « {query} ». Essayez des mots-clés différents ou élargissez les filtres.
                  </div>
                )}
                {!loading && <ResultList results={results} query={query} />}
              </>
            )}

            {libraryView === "manage" && (
              <div className="w-full max-w-2xl flex flex-col gap-4">
                <AddToLibrary />
                <hr className="border-gray-100" />
                <p className="text-xs text-gray-500">
                  Documents indexés dans la bibliothèque. Cliquez sur 🗑️ pour supprimer.
                </p>
                <LibraryManager />
              </div>
            )}
          </>
        )}

      </div>
    </main>
  );
}
