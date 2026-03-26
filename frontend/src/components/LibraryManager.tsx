"use client";

import { useCallback, useEffect, useState } from "react";
import { deleteDocument, getDocumentText, getDocuments } from "@/lib/api";
import {
  getPendingIngestions,
  savePendingIngestions,
  type PendingIngestion,
} from "@/lib/pendingIngestions";
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

function TextModal({ filename, onClose }: { filename: string; onClose: () => void }) {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getDocumentText(filename)
      .then(setText)
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur"))
      .finally(() => setLoading(false));
  }, [filename]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800 truncate">{filename}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none ml-3 shrink-0"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto p-5 flex-1">
          {loading && <p className="text-sm text-gray-400 animate-pulse">Chargement…</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}
          {text && (
            <pre className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed font-sans">
              {text}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

export function LibraryManager() {
  const [docs, setDocs] = useState<DocumentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingIngestion[]>([]);
  const [viewingText, setViewingText] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    getDocuments()
      .then((d) => {
        setDocs(d);
        setPending(getPendingIngestions());
      })
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    setPending(getPendingIngestions());
  }, [load]);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === "edu_tool_pending_ingestions") {
        setPending(getPendingIngestions());
      }
    }
    window.addEventListener("storage", onStorage);
    function onPendingAdded() {
      setPending(getPendingIngestions());
    }
    window.addEventListener("pendingIngestionAdded", onPendingAdded);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pendingIngestionAdded", onPendingAdded);
    };
  }, []);

  useEffect(() => {
    if (pending.length === 0) return;
    const interval = setInterval(() => {
      getDocuments().then((d) => {
        setDocs(d);
        setPending(getPendingIngestions());
      }).catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [pending.length]);

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

  function dismissPending(id: string) {
    setPending((prev) => {
      const next = prev.filter((p) => p.id !== id);
      savePendingIngestions(next);
      return next;
    });
  }

  const isEmpty = !loading && docs.length === 0 && pending.length === 0;

  return (
    <>
      <div className="flex flex-col gap-2">

        {/* Pending items */}
        {pending.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-800 truncate">{p.title}</p>
              <div className="flex gap-1.5 mt-1 flex-wrap items-center">
                <span className="text-xs animate-pulse text-amber-600">⏳ Indexation en cours…</span>
                {p.domaine && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                    {p.domaine}
                  </span>
                )}
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  {p.cycle}
                </span>
              </div>
            </div>
            <button
              onClick={() => dismissPending(p.id)}
              title="Masquer"
              className="text-amber-300 hover:text-amber-500 shrink-0 text-xs"
            >
              ✕
            </button>
          </div>
        ))}

        {/* Real docs */}
        {loading && pending.length === 0 && (
          <p className="text-sm text-gray-400 animate-pulse">Chargement…</p>
        )}

        {isEmpty && (
          <p className="text-sm text-gray-400">
            Aucun document dans la bibliothèque. Utilisez l&apos;onglet <strong>Explorer le Web</strong> ou uploadez un PDF.
          </p>
        )}

        {docs.map((doc) => {
          const colorClass = DOMAINE_COLORS[doc.domaine] ?? "bg-gray-100 text-gray-600";
          const isDeleting = deleting === doc.filename;
          const isConfirming = confirm === doc.filename;
          const hasUrl = !!doc.source_url;

          return (
            <div
              key={doc.filename}
              className="flex items-start gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{doc.filename}</p>
                <div className="flex gap-1.5 mt-1 flex-wrap items-center">
                  {doc.domaine && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${colorClass}`}>
                      {doc.domaine}
                    </span>
                  )}
                  <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                    {doc.cycle}
                  </span>
                  {doc.type_ressource && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                      {doc.type_ressource}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">{doc.source}</span>
                </div>

                {/* Source link + text viewer */}
                <div className="flex gap-2 mt-1.5 flex-wrap">
                  {hasUrl && (
                    <a
                      href={doc.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline truncate max-w-xs"
                    >
                      🔗 Source
                    </a>
                  )}
                  <button
                    onClick={() => setViewingText(doc.filename)}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    📄 Voir le texte
                  </button>
                </div>
              </div>

              {isConfirming ? (
                <div className="flex gap-1.5 shrink-0 mt-0.5">
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
                  className="text-gray-300 hover:text-red-500 transition-colors disabled:opacity-40 shrink-0 mt-0.5"
                >
                  {isDeleting ? "…" : "🗑️"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {!loading && (
        <button
          onClick={load}
          className="self-start text-xs text-gray-400 hover:text-gray-600 mt-1"
        >
          ↻ Actualiser
        </button>
      )}

      {viewingText && (
        <TextModal filename={viewingText} onClose={() => setViewingText(null)} />
      )}
    </>
  );
}
