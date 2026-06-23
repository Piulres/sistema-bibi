import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { updateProtocolTemplate } from "@/lib/care-protocol-service";
import type { ProtocolChecklistItem } from "@/lib/clinical/constants";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const user = await requireInternoModule("cadastros");
    const { id } = await params;
    const body = (await request.json()) as {
      name?: string;
      specialty?: string;
      checklist?: ProtocolChecklistItem[];
      suggestedReturnDays?: number | null;
      active?: boolean;
    };

    const template = await updateProtocolTemplate({
      id,
      tenantId: user.tenantId,
      ...body,
    });

    if (!template) {
      return NextResponse.json({ error: "Protocolo não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    return authErrorResponse(error);
  }
}
