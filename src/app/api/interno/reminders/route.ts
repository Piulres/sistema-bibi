import { NextResponse } from "next/server";
import { authErrorResponse, requireInternoModuleWrite } from "@/lib/api-auth";
import { enqueueDueReminders } from "@/lib/reminder-service";

export async function POST(request: Request) {
  try {
    const user = await requireInternoModuleWrite("comunicacao");
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
