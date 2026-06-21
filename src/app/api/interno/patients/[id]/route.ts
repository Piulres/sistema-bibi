import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { updatePatient } from "@/lib/patient-service";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await requireUser(["INTERNO"]);
    const { id } = await params;
    const body = (await request.json()) as {
      name?: string;
      cpf?: string;
      birthDate?: string;
      phone?: string | null;
      companyId?: string | null;
    };

    const result = await updatePatient({
      tenantId: user.tenantId,
      patientId: id,
      name: body.name,
      cpf: body.cpf,
      birthDate: body.birthDate ? new Date(body.birthDate) : undefined,
      phone: body.phone,
      companyId: body.companyId,
      createdBy: user.id,
    });

    if (!result) {
      return NextResponse.json({ error: "Beneficiário não encontrado" }, { status: 404 });
    }
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return authErrorResponse(error);
  }
}
