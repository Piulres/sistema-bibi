import { NextResponse } from "next/server";
import { buildPatientLgpdExport } from "@/lib/patient-export";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";

type Params = { params: Promise<{ id: string }> };

/** Exportação LGPD light — JSON com dados pessoais e histórico resumido. */
export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireInternoModule("cadastros");
    const { id } = await params;

    const data = await buildPatientLgpdExport(user.tenantId, id);
    if (!data) {
      return NextResponse.json({ error: "Beneficiário não encontrado" }, { status: 404 });
    }

    const filename = `bibi-lgpd-${id}.json`;
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
