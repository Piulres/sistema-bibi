/**
 * Nomes de arquivo legíveis para guias clínicas baixadas na recepção.
 * Sem path separators — Content-Disposition / atributo download.
 */

export function slugifyFilenamePart(value: string, maxLen = 40): string {
  const cleaned = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, maxLen);
  return cleaned || "registro";
}

/** Ex.: receita-joao-pereira-2026-07-27 */
export function clinicalGuideFilenameBase(
  kind: string,
  patientName: string,
  issuedAt: Date = new Date(),
): string {
  const datePart = issuedAt.toISOString().slice(0, 10);
  const namePart = slugifyFilenamePart(patientName);
  return `${kind}-${namePart}-${datePart}`;
}
