import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { canAccessFieldReportAttachment } from "@/lib/project/field-report-service";
import { getAttachmentForDownload } from "@/lib/project/project-service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireUser(["BENEFICIARIO"]);
    if (!user.patientId) {
      return NextResponse.json({ error: "Beneficiário não vinculado" }, { status: 400 });
    }
    const { id } = await params;

    const allowed = await canAccessFieldReportAttachment(user.tenantId, id, {
      role: "BENEFICIARIO",
      patientId: user.patientId,
    });
    if (!allowed) {
      return NextResponse.json({ error: "Anexo não encontrado" }, { status: 404 });
    }

    const result = await getAttachmentForDownload(user.tenantId, id);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(result.buffer), {
      headers: {
        "Content-Type": result.contentType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(result.fileName)}"`,
      },
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
