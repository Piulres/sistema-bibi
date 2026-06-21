import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { enqueueDueReminders } from "@/lib/reminder-service";

export async function POST(request: Request) {
  try {
    const user = await requireUser(["INTERNO"]);
    const body = (await request.json().catch(() => ({}))) as { autoDispatch?: boolean };

    const result = await enqueueDueReminders({
      tenantId: user.tenantId,
      createdBy: user.id,
      autoDispatch: body.autoDispatch ?? true,
    });

    return NextResponse.json({ result });
  } catch (error) {
    return authErrorResponse(error);
  }
}
