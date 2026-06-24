import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { RestoreError, revertRecentChange } from "@/lib/change-management/restore";

export async function POST(request: Request) {
  try {
    const user = await requireInternoModule("cadastros");
    const body = (await request.json()) as {
      entityType: string;
      entityId: string;
    };

    if (!body.entityType?.trim() || !body.entityId?.trim()) {
      return NextResponse.json({ error: "entityType e entityId são obrigatórios" }, { status: 400 });
    }

    const result = await revertRecentChange({
      tenantId: user.tenantId,
      entityType: body.entityType.trim(),
      entityId: body.entityId.trim(),
      createdBy: user.id,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof RestoreError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.code === "WINDOW_EXPIRED" ? 409 : 400 },
      );
    }
    return authErrorResponse(error);
  }
}
