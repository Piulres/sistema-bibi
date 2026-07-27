import { NextResponse } from "next/server";
import { requirePj, authErrorResponse } from "@/lib/api-auth";
import {
  buildPjBeneficiaryImportTemplate,
  runPjBeneficiaryImportBatch,
} from "@/lib/pj-beneficiary-import";
import { interchangeFileExtension, interchangeMimeType, parseInterchangeFormat } from "@/lib/imports/format";

/** Template CSV/JSON para importação em lote de colaboradores PJ. */
export async function GET(request: Request) {
  try {
    await requirePj();
    const url = new URL(request.url);
    const format = parseInterchangeFormat(url.searchParams.get("format"), "csv");
    const content = buildPjBeneficiaryImportTemplate(format);
    const filename = `bibi-colaboradores-template.${interchangeFileExtension(format)}`;

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

/** Importa colaboradores da empresa logada a partir de CSV ou JSON. */
export async function POST(request: Request) {
  try {
    const user = await requirePj();
    const contentType = request.headers.get("content-type") ?? "";
    let content = "";
    let format = parseInterchangeFormat("csv");
    let dryRun = false;

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      format = parseInterchangeFormat(String(form.get("format") ?? "csv"));
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
      format = parseInterchangeFormat(body.format, "csv");
      dryRun = Boolean(body.dryRun);
    }

    if (!content.trim()) {
      return NextResponse.json({ error: "Arquivo vazio" }, { status: 400 });
    }

    const result = await runPjBeneficiaryImportBatch({
      tenantId: user.tenantId,
      companyId: user.companyId,
      userId: user.id,
      content,
      format,
      dryRun,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      message: dryRun
        ? `Simulação: ${result.created} válidos, ${result.errors} erros, ${result.skipped} ignorados`
        : `Importação: ${result.created} criados, ${result.errors} erros, ${result.skipped} ignorados`,
      ...result,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
