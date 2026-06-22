import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import {
  getTenantAuditEvents,
  TIMELINE_ACTIONS,
  TIMELINE_ENTITY_TYPES,
  TIMELINE_ENTITY_LABELS,
} from "@/lib/timeline";

export async function GET(request: Request) {
  try {
    const user = await requireInternoModule("auditoria");
    const url = new URL(request.url);
    const entityType = url.searchParams.get("entityType") ?? undefined;
    const action = url.searchParams.get("action") ?? undefined;
    const search = url.searchParams.get("search") ?? undefined;
    const page = Number(url.searchParams.get("page") ?? "1");
    const limit = Number(url.searchParams.get("limit") ?? "50");

    const fromParam = url.searchParams.get("from");
    const toParam = url.searchParams.get("to");
    const from = fromParam ? new Date(`${fromParam}T00:00:00`) : undefined;
    const to = toParam ? new Date(`${toParam}T23:59:59.999`) : undefined;

    const result = await getTenantAuditEvents(user.tenantId, {
      entityType,
      action,
      search,
      from,
      to,
      page: Number.isFinite(page) ? page : 1,
      limit: Number.isFinite(limit) ? limit : 50,
    });

    return NextResponse.json({
      ...result,
      filters: {
        entityTypes: Object.values(TIMELINE_ENTITY_TYPES).map((value) => ({
          value,
          label: TIMELINE_ENTITY_LABELS[value] ?? value,
        })),
        actions: Object.values(TIMELINE_ACTIONS),
      },
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
