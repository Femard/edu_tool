"use client";

import type { SearchFilters } from "@/lib/types";

const CYCLES = ["Cycle 1", "Cycle 2", "Cycle 3"];
const DOMAINES = [
  "Français",
  "Mathématiques",
  "Sciences",
  "Histoire-Géographie",
  "Espace/Temps",
  "Arts Plastiques",
  "EPS",
  "EMC",
];
const TYPES = [
  "Exercice",
  "Leçon",
  "Fiche de préparation",
  "Texte officiel",
  "Évaluation",
  "Pédagogique",
];

interface FilterPanelProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
}

export function FilterPanel({ filters, onChange }: FilterPanelProps) {
  const update = (key: keyof SearchFilters, value: string) =>
    onChange({ ...filters, [key]: value || undefined });

  return (
    <div className="flex flex-wrap gap-3 w-full max-w-2xl">
      <select
        value={filters.cycle ?? ""}
        onChange={(e) => update("cycle", e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        <option value="">Tous les cycles</option>
        {CYCLES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <select
        value={filters.domaine ?? ""}
        onChange={(e) => update("domaine", e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        <option value="">Tous les domaines</option>
        {DOMAINES.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>

      <select
        value={filters.type_ressource ?? ""}
        onChange={(e) => update("type_ressource", e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        <option value="">Tous les types</option>
        {TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
    </div>
  );
}
