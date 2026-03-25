"use client";

import { useRef, useState } from "react";
import { ingestPdf, ingestUrl, type IngestPdfMeta } from "@/lib/api";

const CYCLES = ["Cycle 1", "Cycle 2", "Cycle 3"];
const NIVEAUX = ["TPS", "PS", "MS", "GS", "CP", "CE1", "CE2", "CM1", "CM2"];
const DOMAINES = [
  "Français", "Mathématiques", "Sciences", "Histoire-Géographie",
  "Espace/Temps", "Arts Plastiques", "EPS", "EMC",
];
const TYPES = ["Exercice", "Leçon", "Fiche de préparation", "Texte officiel", "Évaluation"];

const DEFAULT_META: IngestPdfMeta = {
  cycle: "Cycle 2",
  niveau: "CE2",
  domaine: "Français",
  type_ressource: "Texte officiel",
};

type Mode = "url" | "pdf";
type Status = "idle" | "loading" | "success" | "error";

function MetaFields({
  meta,
  onChange,
}: {
  meta: IngestPdfMeta;
  onChange: (field: keyof IngestPdfMeta, value: string) => void;
}) {
  const fields = [
    { label: "Cycle", field: "cycle" as const, options: CYCLES },
    { label: "Niveau", field: "niveau" as const, options: NIVEAUX },
    { label: "Domaine", field: "domaine" as const, options: DOMAINES },
    { label: "Type de ressource", field: "type_ressource" as const, options: TYPES },
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {fields.map(({ label, field, options }) => (
        <label key={field} className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500">{label}</span>
          <select
            value={meta[field]}
            onChange={(e) => onChange(field, e.target.value)}
            className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {options.map((o) => <option key={o}>{o}</option>)}
          </select>
        </label>
      ))}
    </div>
  );
}

export function AddToLibrary() {
  const [mode, setMode] = useState<Mode>("url");
  const [meta, setMeta] = useState<IngestPdfMeta>(DEFAULT_META);
  const [urlValue, setUrlValue] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function handleField(field: keyof IngestPdfMeta, value: string) {
    setMeta((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    setStatus("loading");
    setErrorMsg("");
    try {
      if (mode === "url") {
        const trimmed = urlValue.trim();
        if (!trimmed) throw new Error("URL vide");
        await ingestUrl(trimmed, meta);
      } else {
        const file = fileRef.current?.files?.[0];
        if (!file) throw new Error("Aucun fichier sélectionné");
        await ingestPdf(file, meta);
      }
      setStatus("success");
      setUrlValue("");
      if (fileRef.current) fileRef.current.value = "";
      setTimeout(() => setStatus("idle"), 3000);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Erreur");
      setStatus("error");
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3 shadow-sm">
      <p className="text-sm font-medium text-gray-700">Ajouter manuellement</p>

      {/* Mode tabs */}
      <div className="flex gap-1">
        {(["url", "pdf"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setStatus("idle"); setErrorMsg(""); }}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              mode === m
                ? "bg-gray-800 text-white border-gray-800"
                : "text-gray-500 border-gray-200 hover:border-gray-400"
            }`}
          >
            {m === "url" ? "🔗 URL" : "📄 PDF"}
          </button>
        ))}
      </div>

      {/* Input */}
      {mode === "url" ? (
        <input
          type="url"
          placeholder="https://eduscol.education.fr/…"
          value={urlValue}
          onChange={(e) => setUrlValue(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      ) : (
        <input
          ref={fileRef}
          type="file"
          accept=".pdf"
          className="text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
        />
      )}

      <MetaFields meta={meta} onChange={handleField} />

      {errorMsg && (
        <p className="text-xs text-red-500">{errorMsg}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={status === "loading" || status === "success"}
        className={`self-end text-xs px-4 py-2 rounded-full font-medium transition-colors ${
          status === "success"
            ? "bg-green-50 border border-green-200 text-green-700"
            : status === "error"
            ? "bg-red-600 text-white hover:bg-red-700"
            : "bg-blue-600 text-white hover:bg-blue-700"
        } disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        {status === "loading" ? "En cours…" : status === "success" ? "✅ Ajouté !" : status === "error" ? "Réessayer" : mode === "url" ? "Ajouter" : "Uploader"}
      </button>
    </div>
  );
}
