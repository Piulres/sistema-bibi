/** Normaliza chips de sugestão para deduplicar frases semanticamente parecidas. */
export function mergeAssistantSuggestions(contextual: string[], portal: string[], limit = 8): string[] {
  const result: string[] = [];

  const normalize = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .replace(/[?!.,]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const isSimilar = (a: string, b: string) => {
    const na = normalize(a);
    const nb = normalize(b);
    if (!na || !nb) return false;
    if (na === nb) return true;
    if (na.includes(nb) || nb.includes(na)) return true;
    const wordsA = new Set(na.split(" "));
    const wordsB = new Set(nb.split(" "));
    let overlap = 0;
    for (const word of wordsA) {
      if (wordsB.has(word) && word.length > 3) overlap += 1;
    }
    return overlap >= 2;
  };

  const add = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (result.some((existing) => isSimilar(existing, trimmed))) return;
    result.push(trimmed);
  };

  for (const item of contextual) add(item);
  for (const item of portal) add(item);
  return result.slice(0, limit);
}
