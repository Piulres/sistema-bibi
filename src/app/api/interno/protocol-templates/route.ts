import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import {
  createProtocolTemplate,
  listProtocolTemplates,
} from "@/lib/care-protocol-service";
import type { ProtocolChecklistItem } from "@/lib/clinical/constants";

export async function GET() {
  try {
    const user = await requireInternoModule("cadastros");
    const templates = await listProtocolTemplates(user.tenantId, false);
    return NextResponse.json({ templates });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireInternoModule("cadastros");
    const body = (await request.json()) as {
      name?: string;
      specialty?: string;
      checklist?: ProtocolChecklistItem[];
      suggestedReturnDays?: number;
    };

    if (!body.name?.trim() || !body.checklist?.length) {
      return NextResponse.json(
        { error: "Informe nome e ao menos um item de checklist" },
        { status: 400 },
      );
    }

    const template = await createProtocolTemplate({
      tenantId: user.tenantId,
      name: body.name,
      specialty: body.specialty,
      checklist: body.checklist,
      suggestedReturnDays: body.suggestedReturnDays,
    });

    return NextResponse.json({ template });
  } catch (error) {
    return authErrorResponse(error);
  }
}
