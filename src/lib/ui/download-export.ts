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

/**
 * Remove separadores de path e caracteres inválidos em nomes de arquivo
 * (evita `07/2026.pdf` virar path e o Chrome falhar o download).
 */
export function sanitizeDownloadFilename(filename: string, fallback: string): string {
  const cleaned = filename
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/-+/g, "-")
    .replace(/\s+/g, " ")
    .replace(/^[-.\s]+|[-.\s]+$/g, "")
    .trim();
  if (!cleaned || cleaned === "." || cleaned === "..") return fallback;
  return cleaned;
}

/** Extrai filename de Content-Disposition (RFC 5987 ou quoted). */
export function parseContentDispositionFilename(
  header: string | null,
  fallback: string,
): string {
  if (!header) return fallback;

  let raw = fallback;
  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      raw = decodeURIComponent(utf8Match[1].trim());
    } catch {
      raw = utf8Match[1].trim();
    }
  } else {
    const quotedMatch = header.match(/filename="([^"]+)"/i);
    if (quotedMatch?.[1]) {
      raw = quotedMatch[1];
    } else {
      const plainMatch = header.match(/filename=([^;]+)/i);
      if (plainMatch?.[1]) raw = plainMatch[1].trim().replace(/^"|"$/g, "");
    }
  }

  return sanitizeDownloadFilename(raw, fallback);
}

function isJsonContentType(contentType: string | null): boolean {
  if (!contentType) return false;
  return contentType.includes("application/json");
}

export type DownloadExportResult =
  | { ok: true; filename: string }
  | { ok: false; error: string; status: number };

/**
 * Baixa arquivo de rota autenticada via fetch + blob.
 * Evita falhas de `<a download>` (erro JSON salvo como .pdf, sessão, navegação).
 *
 * Importante: export JSON legítimo também é `application/json` — só parseia
 * body de erro quando `!response.ok` (nunca consumir o body antes do blob no sucesso).
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
    if (isJsonContentType(contentType)) {
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

  let blob: Blob;
  try {
    blob = await response.blob();
  } catch {
    return {
      ok: false,
      error: "Não foi possível ler o arquivo de exportação.",
      status: response.status,
    };
  }

  if (blob.size === 0) {
    return { ok: false, error: "Arquivo de exportação vazio.", status: response.status };
  }

  // Resposta 200 com JSON de erro (sem Content-Disposition) — ex.: proxy.
  if (isJsonContentType(contentType)) {
    const disposition = response.headers.get("content-disposition");
    if (!disposition || !/attachment/i.test(disposition)) {
      try {
        const text = await blob.text();
        const body = JSON.parse(text) as { error?: string };
        if (body?.error) {
          return { ok: false, error: body.error, status: response.status };
        }
      } catch {
        // JSON tabular legítimo sem disposition — segue download
      }
    }
  }

  const filename = parseContentDispositionFilename(
    response.headers.get("content-disposition"),
    fallbackFilename,
  );

  try {
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
  } catch {
    return {
      ok: false,
      error: "Navegador bloqueou o download do arquivo.",
      status: response.status,
    };
  }

  return { ok: true, filename };
}

/**
 * Abre o PDF autenticado em nova janela e dispara impressão (recepção).
 * Mesmo fetch/blob do download — evita JSON de erro virar “PDF”.
 */
export async function printExportFile(
  url: string,
): Promise<DownloadExportResult> {
  let response: Response;
  try {
    response = await fetch(url, { credentials: "same-origin" });
  } catch {
    return { ok: false, error: "Falha de rede ao carregar para impressão.", status: 0 };
  }

  const contentType = response.headers.get("content-type");

  if (!response.ok) {
    if (isJsonContentType(contentType)) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      return {
        ok: false,
        error: body?.error ?? `Impressão falhou (HTTP ${response.status}).`,
        status: response.status,
      };
    }
    return {
      ok: false,
      error: `Impressão falhou (HTTP ${response.status}).`,
      status: response.status,
    };
  }

  let blob: Blob;
  try {
    blob = await response.blob();
  } catch {
    return {
      ok: false,
      error: "Não foi possível ler o arquivo para impressão.",
      status: response.status,
    };
  }

  if (blob.size === 0) {
    return { ok: false, error: "Arquivo de impressão vazio.", status: response.status };
  }

  const filename = parseContentDispositionFilename(
    response.headers.get("content-disposition"),
    "guia.pdf",
  );

  try {
    const objectUrl = URL.createObjectURL(blob);
    const printWindow = window.open(objectUrl, "_blank", "noopener,noreferrer");
    if (!printWindow) {
      URL.revokeObjectURL(objectUrl);
      return {
        ok: false,
        error: "Pop-up bloqueado — permita janelas para imprimir a guia.",
        status: response.status,
      };
    }
    const triggerPrint = () => {
      try {
        printWindow.focus();
        printWindow.print();
      } catch {
        // Navegador pode bloquear print automático; usuário ainda vê o PDF.
      } finally {
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      }
    };
    if (printWindow.document.readyState === "complete") {
      triggerPrint();
    } else {
      printWindow.addEventListener("load", triggerPrint, { once: true });
      window.setTimeout(triggerPrint, 800);
    }
  } catch {
    return {
      ok: false,
      error: "Navegador bloqueou a impressão do arquivo.",
      status: response.status,
    };
  }

  return { ok: true, filename };
}
