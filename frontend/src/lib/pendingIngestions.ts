const STORAGE_KEY = "edu_tool_pending_ingestions";
const TTL_MS = 180_000; // 3 minutes

export interface PendingIngestion {
  id: string;
  title: string;
  cycle: string;
  domaine: string;
  source: string;
  addedAt: number;
}

export function addPendingIngestion(
  title: string,
  meta: { cycle: string; domaine: string; source?: string },
): void {
  try {
    const raw: PendingIngestion[] = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    const now = Date.now();
    const valid = raw.filter((p) => now - p.addedAt < TTL_MS);
    valid.push({
      id: Math.random().toString(36).slice(2, 9),
      title,
      cycle: meta.cycle,
      domaine: meta.domaine,
      source: meta.source ?? "Manuel",
      addedAt: now,
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
  } catch { /* storage full */ }
}

export function getPendingIngestions(): PendingIngestion[] {
  try {
    const raw: PendingIngestion[] = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    const now = Date.now();
    return raw.filter((p) => now - p.addedAt < TTL_MS);
  } catch { return []; }
}

export function savePendingIngestions(items: PendingIngestion[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch { /* storage full */ }
}
