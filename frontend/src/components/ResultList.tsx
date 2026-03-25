import type { SearchResult } from "@/lib/types";
import { ResultCard } from "./ResultCard";

interface ResultListProps {
  results: SearchResult[];
  query: string;
}

export function ResultList({ results, query }: ResultListProps) {
  if (results.length === 0) return null;

  return (
    <div className="w-full max-w-2xl">
      <p className="text-sm text-gray-500 mb-4">
        <span className="font-medium">{results.length}</span> résultat
        {results.length > 1 ? "s" : ""} pour «{" "}
        <span className="font-medium">{query}</span> »
      </p>
      <div className="flex flex-col gap-3">
        {results.map((r) => (
          <ResultCard key={r.chunk_id} result={r} />
        ))}
      </div>
    </div>
  );
}
