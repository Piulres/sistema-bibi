import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { uploadFieldReportPhoto } from "@/lib/project/field-report-service";

export async function POST(request: Request) {
  try {
    const user = await requireUser(["PRESTADOR"]);
    const form = await request.formData();
    const file = form.get("file");
    const reportId = String(form.get("reportId") ?? "");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Arquivo obrigatório" }, { status: 400 });
    }
    if (!reportId) {
      return NextResponse.json({ error: "Informe reportId" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadFieldReportPhoto({
      tenantId: user.tenantId,
      authorId: user.id,
      reportId,
      fileName: file.name,
      contentType: file.type || "image/jpeg",
      buffer,
    });

    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json(result);
  } catch (error) {
    return authErrorResponse(error);
  }
}
