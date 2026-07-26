import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { getAvailableSlots } from "@/lib/scheduling-service";

/** Prévia dos slots do prestador em uma data (grade + bloqueios − ocupados). */
export async function GET(request: Request) {
  try {
    const user = await requireUser(["PRESTADOR"]);
    const dateRaw = new URL(request.url).searchParams.get("date");
    if (!dateRaw) {
      return NextResponse.json({ error: "Informe date=YYYY-MM-DD" }, { status: 400 });
    }
    const date = new Date(`${dateRaw}T12:00:00`);
    if (Number.isNaN(date.getTime())) {
      return NextResponse.json({ error: "Data inválida" }, { status: 400 });
    }
    const { slots, usingDefault } = await getAvailableSlots({
      tenantId: user.tenantId,
      providerId: user.id,
      date,
    });
    return NextResponse.json({ date: dateRaw, usingDefault, slots, count: slots.length });
  } catch (error) {
    return authErrorResponse(error);
  }
}
