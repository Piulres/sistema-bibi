import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import {
  canCompanyAccessAttachment,
  getAttachmentForDownload,
} from "@/lib/project/project-service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireUser(["PJ"]);
    if (!user.companyId) {
      return NextResponse.json({ error: "Usuário sem empresa vinculada" }, { status: 400 });
    }

    const { id } = await params;
    const allowed = await canCompanyAccessAttachment(user.tenantId, user.companyId, id);
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
        "Content-Disposition": `attachment; filename="${encodeURIComponent(result.fileName)}"`,
      },
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
