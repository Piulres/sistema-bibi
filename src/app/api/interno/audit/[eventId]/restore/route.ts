import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { isInternoAdmin } from "@/lib/interno-permissions";
import { RestoreError, restoreFromTimelineEvent } from "@/lib/change-management/restore";

type Params = { params: Promise<{ eventId: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireInternoModule("auditoria");
    if (!isInternoAdmin(user.role, user.internoProfile)) {
      return NextResponse.json({ error: "Somente administrador pode restaurar" }, { status: 403 });
    }

    const { eventId } = await params;
    const body = (await request.json()) as { confirm?: string };

    const result = await restoreFromTimelineEvent({
      tenantId: user.tenantId,
      eventId,
      createdBy: user.id,
      confirm: body.confirm,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof RestoreError) {
      const status =
        error.code === "NOT_FOUND"
          ? 404
          : error.code === "CONFIRM_REQUIRED"
            ? 400
            : error.code === "FORBIDDEN"
              ? 403
              : 409;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }
    return authErrorResponse(error);
  }
}
