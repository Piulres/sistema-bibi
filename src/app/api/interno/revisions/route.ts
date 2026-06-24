import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { listEntityRevisions } from "@/lib/change-management/revisions";

export async function GET(request: Request) {
  try {
    const user = await requireInternoModule("auditoria");
    const url = new URL(request.url);
    const entityType = url.searchParams.get("entityType");
    const entityId = url.searchParams.get("entityId");

    if (!entityType?.trim() || !entityId?.trim()) {
      return NextResponse.json({ error: "entityType e entityId são obrigatórios" }, { status: 400 });
    }

    const prisma = await getPrisma();
    const revisions = await listEntityRevisions(
      user.tenantId,
      entityType.trim(),
      entityId.trim(),
      prisma,
    );

    return NextResponse.json({ revisions });
  } catch (error) {
    return authErrorResponse(error);
  }
}
