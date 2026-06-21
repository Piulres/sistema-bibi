import { NextResponse } from "next/server";
import { buildTissGuideXml } from "@/lib/tiss-service";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireInternoModule("billing");
    const { id } = await params;

    const xml = await buildTissGuideXml(user.tenantId, id);
    if (!xml) {
      return NextResponse.json({ error: "Fatura não encontrada" }, { status: 404 });
    }

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Content-Disposition": `attachment; filename="tiss-guia-${id}.xml"`,
      },
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
