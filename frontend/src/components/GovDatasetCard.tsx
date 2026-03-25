"use client";

import { useState } from "react";
import { govGetResources, govIngest, type GovIngestMeta } from "@/lib/api";
import type { GovDataset, GovResource, IngestStatus } from "@/lib/types";

const CYCLES = ["Cycle 1", "Cycle 2", "Cycle 3"];
const NIVEAUX = ["TPS", "PS", "MS", "GS", "CP", "CE1", "CE2", "CM1", "CM2"];
const DOMAINES = [
  "Français", "Mathématiques", "Sciences", "Histoire-Géographie",
  "Espace/Temps", "Arts Plastiques", "EPS", "EMC",
];
const TYPES = ["Exercice", "Leçon", "Fiche de préparation", "Texte officiel", "Évaluation"];

const DEFAULT_META: GovIngestMeta = {
  cycle: "Cycle 2",
  niveau: "CE2",
  domaine: "Français",
  type_ressource: "Texte officiel",
};

function ResourceRow({ datasetId, resource }: { datasetId: string; resource: GovResource }) {
  const [status, setStatus] = useState<IngestStatus>("idle");
  const [showModal, setShowModal] = useState(false);
  const [meta, setMeta] = useState<GovIngestMeta>(DEFAULT_META);

  function handleField(field: keyof GovIngestMeta, value: string) {
    setMeta((prev) => ({ ...prev, [field]: value }));
  }

  async function handleConfirm() {
    setShowModal(false);
    setStatus("loading");
    try {
      await govIngest(datasetId, resource, meta);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  const btnLabel: Record<IngestStatus, string> = {
    idle: "📥 Ajouter",
    loading: "En cours…",
    success: "✅ Ajouté",
    error: "❌ Réessayer",
  };

  return (
    <>
      <div className="flex items-center justify-between gap-2 py-1.5 border-t border-gray-100">
        <div className="flex-1 min-w-0">
          <span className="text-xs text-gray-700 line-clamp-1">{resource.title}</span>
          {resource.format && (
            <span className="ml-1.5 text-[10px] font-medium text-gray-400 uppercase">
              {resource.format}
            </span>
          )}
        </div>
        <button
          onClick={() => {
            if (status === "error") setStatus("idle");
            if (status === "idle" || status === "error") setShowModal(true);
          }}
          disabled={status === "loading" || status === "success"}
          className={`shrink-0 text-xs px-2.5 py-1 rounded-full border transition-colors ${
            status === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : status === "error"
              ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
              : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
          } disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          {btnLabel[status]}
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4">
            <div>
              <h2 className="text-base font-semibold text-gray-800">Classer cette ressource</h2>
              <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{resource.title}</p>
            </div>
            <div className="flex flex-col gap-3">
              {(
                [
                  { label: "Cycle", field: "cycle" as const, options: CYCLES },
                  { label: "Niveau", field: "niveau" as const, options: NIVEAUX },
                  { label: "Domaine", field: "domaine" as const, options: DOMAINES },
                  { label: "Type de ressource", field: "type_ressource" as const, options: TYPES },
                ] as const
              ).map(({ label, field, options }) => (
                <label key={field} className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-gray-600">{label}</span>
                  <select
                    value={meta[field]}
                    onChange={(e) => handleField(field, e.target.value)}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    {options.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </label>
              ))}
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

export function GovDatasetCard({ dataset }: { dataset: GovDataset }) {
  const [expanded, setExpanded] = useState(false);
  const [resources, setResources] = useState<GovResource[]>([]);
  const [loadingRes, setLoadingRes] = useState(false);
  const [resError, setResError] = useState<string | null>(null);

  async function handleExpand() {
    if (expanded) { setExpanded(false); return; }
    setExpanded(true);
    if (resources.length > 0) return; // déjà chargées
    setLoadingRes(true);
    setResError(null);
    try {
      const data = await govGetResources(dataset.id);
      setResources(data);
    } catch (e) {
      setResError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoadingRes(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-2 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 line-clamp-2">{dataset.title}</p>
          {dataset.organization && (
            <p className="text-xs text-blue-600 mt-0.5">{dataset.organization}</p>
          )}
          {dataset.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{dataset.description}</p>
          )}
        </div>
        <button
          onClick={handleExpand}
          className="shrink-0 text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-500 hover:border-gray-400 transition-colors"
        >
          {expanded ? "▲ Fermer" : "▼ Ressources"}
        </button>
      </div>

      {expanded && (
        <div className="mt-1 flex flex-col">
          {loadingRes && (
            <p className="text-xs text-gray-400 animate-pulse py-1">Chargement des ressources…</p>
          )}
          {resError && (
            <p className="text-xs text-red-500 py-1">{resError}</p>
          )}
          {!loadingRes && !resError && resources.length === 0 && (
            <p className="text-xs text-gray-400 italic py-1">Aucun fichier exploitable.</p>
          )}
          {resources.map((r) => (
            <ResourceRow key={r.id || r.url} datasetId={dataset.id} resource={r} />
          ))}
        </div>
      )}
    </div>
  );
}
