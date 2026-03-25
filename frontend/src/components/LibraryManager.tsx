"use client";

import { useCallback, useEffect, useState } from "react";
import { deleteDocument, getDocuments } from "@/lib/api";
import type { DocumentInfo } from "@/lib/types";

const DOMAINE_COLORS: Record<string, string> = {
  Français: "bg-blue-100 text-blue-700",
  Mathématiques: "bg-green-100 text-green-700",
  Sciences: "bg-purple-100 text-purple-700",
  "Histoire-Géographie": "bg-yellow-100 text-yellow-700",
  "Espace/Temps": "bg-orange-100 text-orange-700",
  "Arts Plastiques": "bg-pink-100 text-pink-700",
  EPS: "bg-cyan-100 text-cyan-700",
  EMC: "bg-red-100 text-red-700",
};

export function LibraryManager() {
  const [docs, setDocs] = useState<DocumentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    getDocuments()
      .then(setDocs)
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(filename: string) {
    setConfirm(null);
    setDeleting(filename);
    try {
      await deleteDocument(filename);
      setDocs((prev) => prev.filter((d) => d.filename !== filename));
    } catch {
      // silently keep the doc in the list if deletion failed
    } finally {
      setDeleting(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-400 animate-pulse">Chargement…</p>;
  }

  if (docs.length === 0) {
    return (
      <p className="text-sm text-gray-400">
        Aucun document dans la bibliothèque. Utilisez l&apos;onglet <strong>Explorer le Web</strong> ou uploadez un PDF.
      </p>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {docs.map((doc) => {
          const colorClass = DOMAINE_COLORS[doc.domaine] ?? "bg-gray-100 text-gray-600";
          const isDeleting = deleting === doc.filename;
          const isConfirming = confirm === doc.filename;

          return (
            <div
              key={doc.filename}
              className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{doc.filename}</p>
                <div className="flex gap-1.5 mt-1 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${colorClass}`}>
                    {doc.domaine}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                    {doc.cycle}
                  </span>
                  <span className="text-xs text-gray-400">{doc.source}</span>
                </div>
              </div>

              {isConfirming ? (
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => setConfirm(null)}
                    className="text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => handleDelete(doc.filename)}
                    className="text-xs px-2.5 py-1 rounded-full bg-red-600 text-white hover:bg-red-700"
                  >
                    Confirmer
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirm(doc.filename)}
                  disabled={isDeleting}
                  title="Supprimer ce document"
                  className="text-gray-300 hover:text-red-500 transition-colors disabled:opacity-40 shrink-0"
                >
                  {isDeleting ? "…" : "🗑️"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={load}
        className="self-start text-xs text-gray-400 hover:text-gray-600 mt-1"
      >
        ↻ Actualiser
      </button>
    </>
  );
}
