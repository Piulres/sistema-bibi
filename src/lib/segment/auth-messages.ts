/** Mensagens de mismatch tenant/portal no login (sem I/O). */

export function buildSegmentMismatchMessage(input: {
  userName: string;
  userSlug: string | null | undefined;
  currentPortal: string;
  userNicheFallback?: string;
}): string {
  const { userName, userSlug, currentPortal, userNicheFallback } = input;
  if (userSlug) {
    return `Esta conta pertence a ${userName}. Você está no portal de ${currentPortal}. Acesse com ?tenant=${userSlug}.`;
  }
  const niche = userNicheFallback ?? "outro segmento";
  return `Esta conta pertence a ${userName} (${niche}). Você está no portal de ${currentPortal}.`;
}
