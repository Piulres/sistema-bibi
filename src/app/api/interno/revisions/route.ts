import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { listEntityRevisions } from "@/lib/change-management/revisions";
import {
  auditDetailLevelForEntity,
  redactSnapshotForLevel,
  resolveAuditProfile,
} from "@/lib/audit-access";

export async function GET(request: Request) {
  try {
    const user = await requireInternoModule("auditoria");
    const url = new URL(request.url);
    const entityType = url.searchParams.get("entityType");
    const entityId = url.searchParams.get("entityId");

    if (!entityType?.trim() || !entityId?.trim()) {
      return NextResponse.json({ error: "entityType e entityId são obrigatórios" }, { status: 400 });
    }

    const profile = resolveAuditProfile(user.internoProfile);
    const level = auditDetailLevelForEntity(profile, entityType.trim());
    if (level === "hidden") {
      return NextResponse.json({ error: "Sem permissão para revisões desta entidade" }, { status: 403 });
    }

    const prisma = await getPrisma();
    const revisions = await listEntityRevisions(
      user.tenantId,
      entityType.trim(),
      entityId.trim(),
      prisma,
    );

    const maskFinancial = level !== "full";
    return NextResponse.json({
      revisions: revisions.map((revision) => ({
        ...revision,
        snapshot: redactSnapshotForLevel(revision.snapshot, level, { maskFinancial }),
      })),
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
