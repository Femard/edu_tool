"use client";

import { useState } from "react";
import { generateExercice } from "@/lib/api";
import type { SearchResult } from "@/lib/types";

const DOMAINE_COLORS: Record<string, string> = {
  Français: "bg-blue-100 text-blue-800",
  Mathématiques: "bg-green-100 text-green-800",
  Sciences: "bg-purple-100 text-purple-800",
  "Histoire-Géographie": "bg-yellow-100 text-yellow-800",
  "Espace/Temps": "bg-orange-100 text-orange-800",
  "Arts Plastiques": "bg-pink-100 text-pink-800",
  EPS: "bg-cyan-100 text-cyan-800",
  EMC: "bg-red-100 text-red-800",
};

const TYPE_ICONS: Record<string, string> = {
  Exercice: "✏️",
  Leçon: "📖",
  "Fiche de préparation": "📋",
  "Texte officiel": "📜",
  Évaluation: "📝",
};

interface ResultCardProps {
  result: SearchResult;
}

export function ResultCard({ result }: ResultCardProps) {
  const { metadata, text, score, chunk_id } = result;
  const colorClass = DOMAINE_COLORS[metadata.domaine] ?? "bg-gray-100 text-gray-800";
  const relevance = Math.round(score * 100);
  const icon = TYPE_ICONS[metadata.type_ressource] ?? "📄";

  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setGenError(null);
    setGenerated(null);
    try {
      const res = await generateExercice(
        "Génère un exercice pédagogique varié à partir de ce contenu, adapté au niveau " + metadata.niveau,
        chunk_id,
      );
      setGenerated(res.answer);
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Erreur de génération");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <article className="border border-gray-200 rounded-xl p-5 bg-white hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex flex-wrap gap-1.5">
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${colorClass}`}>
            {metadata.domaine}
          </span>
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800">
            {metadata.cycle} · {metadata.niveau}
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
            {icon} {metadata.type_ressource}
          </span>
        </div>
        {relevance > 0 && (
          <span className="text-xs text-gray-400 shrink-0 mt-0.5">
            {relevance}% pertinent
          </span>
        )}
      </div>

      {/* Inline content preview */}
      <p className="text-sm text-gray-700 leading-relaxed line-clamp-5 whitespace-pre-wrap">
        {text}
      </p>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className="font-medium">{metadata.source}</span>
          <span>·</span>
          <span>{metadata.filename}</span>
          <span>·</span>
          <span>p.{metadata.page_number}</span>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="text-xs px-3 py-1.5 rounded-full border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          {generating ? "Génération…" : "🪄 Générer un exercice"}
        </button>
      </div>

      {/* Generated result */}
      {generating && (
        <div className="mt-4 text-xs text-gray-400 animate-pulse">
          Mistral réfléchit…
        </div>
      )}
      {genError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          {genError}
        </div>
      )}
      {generated && (
        <div className="mt-4 p-4 bg-violet-50 border border-violet-200 rounded-lg">
          <p className="text-xs font-semibold text-violet-700 mb-2">🪄 Exercice généré par Mistral</p>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{generated}</p>
        </div>
      )}
    </article>
  );
}
