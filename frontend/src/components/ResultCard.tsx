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
  const { metadata, text, score } = result;
  const colorClass = DOMAINE_COLORS[metadata.domaine] ?? "bg-gray-100 text-gray-800";
  const relevance = Math.round(score * 100);
  const icon = TYPE_ICONS[metadata.type_ressource] ?? "📄";

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

      {/* Inline content preview — the key UX feature */}
      <p className="text-sm text-gray-700 leading-relaxed line-clamp-5 whitespace-pre-wrap">
        {text}
      </p>

      <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
        <span className="font-medium">{metadata.source}</span>
        <span>·</span>
        <span>{metadata.filename}</span>
        <span>·</span>
        <span>p.{metadata.page_number}</span>
      </div>
    </article>
  );
}
