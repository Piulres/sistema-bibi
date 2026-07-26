import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import {
  listWeeklyAvailability,
  replaceWeeklyAvailability,
  type WeeklyAvailabilityInput,
} from "@/lib/availability/provider-availability-service";

/** Grade semanal do prestador logado. */
export async function GET() {
  try {
    const user = await requireUser(["PRESTADOR"]);
    const data = await listWeeklyAvailability({
      tenantId: user.tenantId,
      providerId: user.id,
    });
    return NextResponse.json(data);
  } catch (error) {
    return authErrorResponse(error);
  }
}

/** Substitui a grade semanal (lista completa de janelas). */
export async function PUT(request: Request) {
  try {
    const user = await requireUser(["PRESTADOR"]);
    const body = (await request.json()) as { windows?: WeeklyAvailabilityInput[] };
    if (!Array.isArray(body.windows)) {
      return NextResponse.json({ error: "Informe windows[]" }, { status: 400 });
    }
    const result = await replaceWeeklyAvailability({
      tenantId: user.tenantId,
      providerId: user.id,
      windows: body.windows,
    });
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    const data = await listWeeklyAvailability({
      tenantId: user.tenantId,
      providerId: user.id,
    });
    return NextResponse.json({ ok: true, ...data, saved: result.count });
  } catch (error) {
    return authErrorResponse(error);
  }
}
