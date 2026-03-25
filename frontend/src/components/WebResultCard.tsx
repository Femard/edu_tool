"use client";

import { useState } from "react";
import { ingestUrl } from "@/lib/api";
import type { IngestStatus, WebSearchResult } from "@/lib/types";

interface Props {
  result: WebSearchResult;
}

const BUTTON_LABEL: Record<IngestStatus, string> = {
  idle: "📥 Ajouter à ma bibliothèque",
  loading: "Ajout en cours…",
  success: "✅ Ajouté !",
  error: "❌ Erreur — Réessayer",
};

export function WebResultCard({ result }: Props) {
  const [status, setStatus] = useState<IngestStatus>("idle");

  async function handleAdd() {
    setStatus("loading");
    try {
      await ingestUrl(result.url);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-2 shadow-sm hover:shadow-md transition-shadow">
      <a
        href={result.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 font-medium hover:underline text-sm line-clamp-1"
      >
        {result.title}
      </a>
      <p className="text-xs text-gray-400 truncate">{result.url}</p>
      <p className="text-sm text-gray-600 line-clamp-3">{result.snippet}</p>
      <button
        onClick={handleAdd}
        disabled={status === "loading" || status === "success"}
        className={`mt-1 self-start text-xs px-3 py-1.5 rounded-full border transition-colors
          ${status === "success"
            ? "border-green-200 bg-green-50 text-green-700"
            : status === "error"
            ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
            : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
          } disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        {BUTTON_LABEL[status]}
      </button>
    </div>
  );
}
