import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { buildPjReportCsv } from "@/lib/pj-portal-service";

export async function GET() {
  try {
    const user = await requireUser(["PJ"]);
    if (!user.companyId) {
      return NextResponse.json({ error: "Usuário sem empresa vinculada" }, { status: 400 });
    }

    const csv = await buildPjReportCsv(user.companyId, user.tenantId);
    if (!csv) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="bibi-pj-relatorio.csv"',
      },
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
