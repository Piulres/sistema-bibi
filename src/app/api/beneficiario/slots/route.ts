import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { getAvailableSlots } from "@/lib/scheduling-service";

export async function GET(request: Request) {
  try {
    const user = await requireUser(["BENEFICIARIO"]);
    const url = new URL(request.url);
    const providerId = url.searchParams.get("providerId");
    const date = url.searchParams.get("date");

    if (!providerId || !date) {
      return NextResponse.json({ error: "Informe providerId e date (YYYY-MM-DD)" }, { status: 400 });
    }

    const result = await getAvailableSlots({
      tenantId: user.tenantId,
      providerId,
      date: new Date(`${date}T12:00:00`),
    });

    return NextResponse.json(result);
  } catch (error) {
    return authErrorResponse(error);
  }
}
