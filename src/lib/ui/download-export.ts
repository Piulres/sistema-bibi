import type { ExportFormat } from "@/lib/exports/format";

export type ExportDownloadQuery = Record<string, string | undefined>;

/** Monta URL de exportação com query string. */
export function buildExportUrl(
  baseUrl: string,
  query: ExportDownloadQuery = {},
  format?: ExportFormat,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  if (format) params.set("format", format);
  const qs = params.toString();
  return qs ? `${baseUrl}?${qs}` : baseUrl;
}

/** Extrai filename de Content-Disposition (RFC 5987 ou quoted). */
export function parseContentDispositionFilename(
  header: string | null,
  fallback: string,
): string {
  if (!header) return fallback;

  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim());
    } catch {
      return utf8Match[1].trim();
    }
  }

  const quotedMatch = header.match(/filename="([^"]+)"/i);
  if (quotedMatch?.[1]) return quotedMatch[1];

  const plainMatch = header.match(/filename=([^;]+)/i);
  if (plainMatch?.[1]) return plainMatch[1].trim().replace(/^"|"$/g, "");

  return fallback;
}

function isJsonErrorResponse(contentType: string | null): boolean {
  if (!contentType) return false;
  return contentType.includes("application/json");
}

export type DownloadExportResult =
  | { ok: true; filename: string }
  | { ok: false; error: string; status: number };

/**
 * Baixa arquivo de rota autenticada via fetch + blob.
 * Evita falhas de `<a download>` (erro JSON salvo como .pdf, sessão, navegação).
 */
export async function downloadExportFile(
  url: string,
  fallbackFilename = "export",
): Promise<DownloadExportResult> {
  let response: Response;
  try {
    response = await fetch(url, { credentials: "same-origin" });
  } catch {
    return { ok: false, error: "Falha de rede ao exportar.", status: 0 };
  }

  const contentType = response.headers.get("content-type");

  if (!response.ok) {
    if (isJsonErrorResponse(contentType)) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      return {
        ok: false,
        error: body?.error ?? `Exportação falhou (HTTP ${response.status}).`,
        status: response.status,
      };
    }
    return {
      ok: false,
      error: `Exportação falhou (HTTP ${response.status}).`,
      status: response.status,
    };
  }

  if (isJsonErrorResponse(contentType)) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    if (body?.error) {
      return { ok: false, error: body.error, status: response.status };
    }
  }

  const blob = await response.blob();
  if (blob.size === 0) {
    return { ok: false, error: "Arquivo de exportação vazio.", status: response.status };
  }

  const filename = parseContentDispositionFilename(
    response.headers.get("content-disposition"),
    fallbackFilename,
  );

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);

  return { ok: true, filename };
}
