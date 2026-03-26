"use client";

import { useState } from "react";
import { ingestUrl, type IngestUrlMeta } from "@/lib/api";
import { addPendingIngestion } from "@/lib/pendingIngestions";
import type { IngestStatus, WebSearchResult } from "@/lib/types";

const CYCLES = ["Cycle 1", "Cycle 2", "Cycle 3"];
const NIVEAUX = ["TPS", "PS", "MS", "GS", "CP", "CE1", "CE2", "CM1", "CM2"];
const DOMAINES = [
  "Français", "Mathématiques", "Sciences", "Histoire-Géographie",
  "Espace/Temps", "Arts Plastiques", "EPS", "EMC",
];
const TYPES = ["Exercice", "Leçon", "Fiche de préparation", "Texte officiel", "Évaluation", "Pédagogique"];

interface Props {
  result: WebSearchResult;
}

const DEFAULT_META: IngestUrlMeta = {
  cycle: "Cycle 2",
  niveau: "CE2",
  domaine: "Français",
  type_ressource: "Exercice",
};

export function WebResultCard({ result }: Props) {
  const [status, setStatus] = useState<IngestStatus>("idle");
  const [showModal, setShowModal] = useState(false);
  const [meta, setMeta] = useState<IngestUrlMeta>(DEFAULT_META);

  function handleField(field: keyof IngestUrlMeta, value: string) {
    setMeta((prev) => ({ ...prev, [field]: value }));
  }

  async function handleConfirm() {
    setShowModal(false);
    setStatus("loading");
    try {
      const effectiveMeta = meta.type_ressource === "Pédagogique" ? { ...meta, domaine: "" } : meta;
      await ingestUrl(result.url, effectiveMeta);
      addPendingIngestion(result.title || result.url, { cycle: meta.cycle, domaine: effectiveMeta.domaine, source: "Web" });
      window.dispatchEvent(new Event("pendingIngestionAdded"));
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  const buttonLabel: Record<IngestStatus, string> = {
    idle: "📥 Ajouter à ma bibliothèque",
    loading: "Ajout en cours…",
    success: "✅ Ajouté !",
    error: "❌ Erreur — Réessayer",
  };

  return (
    <>
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
          onClick={() => {
            if (status === "error") { setStatus("idle"); }
            if (status === "idle" || status === "error") setShowModal(true);
          }}
          disabled={status === "loading" || status === "success"}
          className={`mt-1 self-start text-xs px-3 py-1.5 rounded-full border transition-colors
            ${status === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : status === "error"
              ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
              : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
            } disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          {buttonLabel[status]}
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4">
            <div>
              <h2 className="text-base font-semibold text-gray-800">
                Classer cette ressource
              </h2>
              <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{result.title}</p>
            </div>

            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-600">Cycle</span>
                <select
                  value={meta.cycle}
                  onChange={(e) => handleField("cycle", e.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {CYCLES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-600">Niveau</span>
                <select
                  value={meta.niveau}
                  onChange={(e) => handleField("niveau", e.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {NIVEAUX.map((n) => <option key={n}>{n}</option>)}
                </select>
              </label>

              {meta.type_ressource !== "Pédagogique" && (
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-gray-600">Domaine</span>
                  <select
                    value={meta.domaine}
                    onChange={(e) => handleField("domaine", e.target.value)}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    {DOMAINES.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </label>
              )}

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-600">Type de ressource</span>
                <select
                  value={meta.type_ressource}
                  onChange={(e) => handleField("type_ressource", e.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </label>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
