import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { getAttachmentForDownload } from "@/lib/project/project-service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireInternoModule("projetos");
    const { id } = await params;
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
