import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { convertInterchangeContent } from "@/lib/imports/interchange";
import { parseInterchangeFormat, interchangeMimeType } from "@/lib/imports/format";

/** Converte payload de importação entre JSON e CSV. */
export async function POST(request: Request) {
  try {
    await requireInternoModule("cadastros");

    const body = (await request.json()) as {
      content?: string;
      from?: string;
      to?: string;
      entity?: string;
    };

    if (!body.content?.trim()) {
      return NextResponse.json({ error: "Informe o conteúdo" }, { status: 400 });
    }

    const from = parseInterchangeFormat(body.from, "json");
    const to = parseInterchangeFormat(body.to, from === "json" ? "csv" : "json");
    const entity = body.entity?.trim() ?? "patients";

    if (!isImportEntity(entity)) {
      return NextResponse.json({ error: "Entidade inválida" }, { status: 400 });
    }

    const converted = convertInterchangeContent({
      content: body.content,
      from,
      to,
      entity,
      columns: getImportColumns(entity),
    });

    if (!converted.ok) {
      return NextResponse.json({ error: converted.error }, { status: 400 });
    }

    return NextResponse.json({
      from,
      to,
      entity,
      rowCount: converted.dataset.rows.length,
      content: converted.content,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}

/** GET com query params para download direto da conversão (útil em links). */
export async function GET() {
  return NextResponse.json({
    description: "POST com { content, from, to, entity } para converter JSON ↔ CSV",
    formats: ["json", "csv"],
    mime: {
      json: interchangeMimeType("json"),
      csv: interchangeMimeType("csv"),
    },
  });
}
