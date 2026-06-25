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
      providerId?: string;
      procedureId?: string;
      autoAssignProvider?: boolean;
      scheduledAt: string;
      reason?: string | null;
      petName?: string | null;
      petSpecies?: string | null;
    };

    if (!body.providerId && !body.autoAssignProvider) {
      return NextResponse.json(
        { error: "Informe o prestador ou marque atribuição automática" },
        { status: 400 },
      );
    }

    const result = await walkInAndSchedule({
      tenantId: user.tenantId,
      name: body.name,
      cpf: body.cpf,
      birthDate: new Date(body.birthDate),
      phone: body.phone,
      providerId: body.providerId,
      procedureId: body.procedureId,
      autoAssignProvider: body.autoAssignProvider,
      scheduledAt: new Date(body.scheduledAt),
      reason: body.reason,
      createdBy: user.id,
      petName: body.petName,
      petSpecies: body.petSpecies,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return authErrorResponse(error);
  }
}
