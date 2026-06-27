import "server-only";
import { listProcedures } from "@/lib/procedure-service";
import { normalizeEntitySearch } from "@/lib/assistant/resolve-entities";

const catalogCache = new Map<string, { at: number; names: { id: string; name: string; normalized: string }[] }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

async function getProcedureIndex(tenantId: string) {
  const cached = catalogCache.get(tenantId);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.names;

  const procedures = await listProcedures(tenantId);
  const names = procedures.map((p) => ({
    id: p.id,
    name: p.name,
    normalized: normalizeEntitySearch(p.name),
  }));
  catalogCache.set(tenantId, { at: Date.now(), names });
  return names;
}

/** Encontra procedimento do catálogo do tenant no texto — evita lista fixa só-médica. */
export async function matchProcedureNameInText(
  tenantId: string,
  raw: string,
): Promise<string | undefined> {
  const text = normalizeEntitySearch(raw);
  if (text.length < 3) return undefined;

  const catalog = await getProcedureIndex(tenantId);
  let best: { name: string; score: number } | null = null;

  for (const item of catalog) {
    if (item.normalized.length < 3) continue;
    if (text.includes(item.normalized)) {
      const score = item.normalized.length;
      if (!best || score > best.score) best = { name: item.name, score };
    }
  }

  return best?.name;
}

export function clearProcedureMatchCache(tenantId?: string): void {
  if (tenantId) catalogCache.delete(tenantId);
  else catalogCache.clear();
}
