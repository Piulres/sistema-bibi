/** Normaliza texto para comparação de gatilhos (minúsculas, sem acento). */
export function normalizeMockText(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Verifica se algum gatilho aparece no texto (substring ou palavra inteira para termos curtos). */
export function matchesTrigger(text: string, trigger: string): boolean {
  const t = normalizeMockText(trigger);
  if (t.length === 0) return false;
  if (t.length <= 5) {
    const re = new RegExp(`(?:^|\\s)${escapeRegExp(t)}(?:\\s|$|[?.!,])`);
    return re.test(` ${text} `);
  }
  return text.includes(t);
}

export function matchesAnyTrigger(text: string, triggers: readonly string[]): boolean {
  return triggers.some((trigger) => matchesTrigger(text, trigger));
}

/** Pontua intenção: soma comprimento dos gatilhos que casaram (frases longas vencem). */
export function scoreTriggers(text: string, triggers: readonly string[]): number {
  let score = 0;
  for (const trigger of triggers) {
    const t = normalizeMockText(trigger);
    if (matchesTrigger(text, t)) score += t.length;
  }
  return score;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Divide pergunta composta: "agendamentos hoje e quem deve". */
export function splitCompositeQuery(text: string): string[] {
  const parts = text
    .split(/\s+(?:e|tambem|também|alem disso|além disso|e tambem|e também)\s+/i)
    .map((p) => p.trim())
    .filter((p) => p.length > 2);
  return parts.length > 1 ? parts : [text];
}
