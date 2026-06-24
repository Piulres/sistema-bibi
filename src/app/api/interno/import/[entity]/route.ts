import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import {
  buildImportTemplate,
  runImportBatch,
  serializeImportExport,
} from "@/lib/imports/import-service";
import {
  interchangeFileExtension,
  interchangeMimeType,
  parseInterchangeFormat,
  type InterchangeFormat,
} from "@/lib/imports/format";
import { getImportEntityLabel, isImportEntity } from "@/lib/imports/schemas";

type Params = { params: Promise<{ entity: string }> };

function attachmentFilename(entity: string, mode: string, format: string): string {
  return `bibi-${entity}-${mode}.${interchangeFileExtension(format as "json" | "csv")}`;
}

/** Template ou exportação dos dados atuais em JSON/CSV. */
export async function GET(request: Request, { params }: Params) {
  try {
    const user = await requireInternoModule("cadastros");
    const { entity: entityRaw } = await params;

    if (!isImportEntity(entityRaw)) {
      return NextResponse.json({ error: "Entidade inválida" }, { status: 400 });
    }

    const url = new URL(request.url);
    const format = parseInterchangeFormat(url.searchParams.get("format"), "json");
    const mode = url.searchParams.get("mode") === "export" ? "export" : "template";

    const content =
      mode === "export"
        ? await serializeImportExport(user.tenantId, entityRaw, format)
        : buildImportTemplate(entityRaw, format);

    const filename = attachmentFilename(entityRaw, mode, format);

    return new NextResponse(content, {
      headers: {
        "Content-Type": interchangeMimeType(format),
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}

/** Importa lote a partir de JSON ou CSV (dry-run opcional). */
export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireInternoModule("cadastros");
    const { entity: entityRaw } = await params;

    if (!isImportEntity(entityRaw)) {
      return NextResponse.json({ error: "Entidade inválida" }, { status: 400 });
    }

    const contentType = request.headers.get("content-type") ?? "";
    let content = "";
    let format: InterchangeFormat = "json";
    let dryRun = false;

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      format = parseInterchangeFormat(String(form.get("format") ?? "json"));
      dryRun = String(form.get("dryRun") ?? "") === "true";
      if (file instanceof File) {
        content = await file.text();
      } else {
        content = String(form.get("content") ?? "");
      }
    } else {
      const body = (await request.json()) as {
        content?: string;
        format?: string;
        dryRun?: boolean;
      };
      content = body.content ?? "";
      format = parseInterchangeFormat(body.format, "json");
      dryRun = body.dryRun ?? false;
    }

    if (!content.trim()) {
      return NextResponse.json({ error: "Conteúdo vazio" }, { status: 400 });
    }

    const result = await runImportBatch({
      tenantId: user.tenantId,
      userId: user.id,
      entity: entityRaw,
      format,
      content,
      dryRun,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ...result,
      entityLabel: getImportEntityLabel(entityRaw),
      message: result.dryRun
        ? `Simulação: ${result.created} válido(s), ${result.skipped} ignorado(s), ${result.errors} erro(s)`
        : `Importação concluída: ${result.created} criado(s), ${result.skipped} ignorado(s), ${result.errors} erro(s)`,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
