import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { walkInAndSchedule } from "@/lib/change-management/appointment-cancel";

export async function POST(request: Request) {
  try {
    const user = await requireInternoModule("agenda");
    const body = (await request.json()) as {
      name: string;
      cpf: string;
      birthDate: string;
      phone?: string | null;
      providerId: string;
      scheduledAt: string;
      reason?: string | null;
    };

    const result = await walkInAndSchedule({
      tenantId: user.tenantId,
      name: body.name,
      cpf: body.cpf,
      birthDate: new Date(body.birthDate),
      phone: body.phone,
      providerId: body.providerId,
      scheduledAt: new Date(body.scheduledAt),
      reason: body.reason,
      createdBy: user.id,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return authErrorResponse(error);
  }
}
