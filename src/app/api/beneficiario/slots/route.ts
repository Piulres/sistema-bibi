import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import {
  getAvailableSlots,
  getAvailableSlotsAcrossProviders,
} from "@/lib/scheduling-service";

export async function GET(request: Request) {
  try {
    const user = await requireUser(["BENEFICIARIO"]);
    const url = new URL(request.url);
    const providerId = url.searchParams.get("providerId");
    const date = url.searchParams.get("date");
    const anyProvider = providerId === "any" || providerId === "";

    if (!date) {
      return NextResponse.json({ error: "Informe date (YYYY-MM-DD)" }, { status: 400 });
    }

    const slotDate = new Date(`${date}T12:00:00`);

    if (anyProvider || !providerId) {
      const result = await getAvailableSlotsAcrossProviders({
        tenantId: user.tenantId,
        date: slotDate,
      });
      return NextResponse.json(result);
    }

    const result = await getAvailableSlots({
      tenantId: user.tenantId,
      providerId,
      date: slotDate,
    });

    return NextResponse.json(result);
  } catch (error) {
    return authErrorResponse(error);
  }
}
