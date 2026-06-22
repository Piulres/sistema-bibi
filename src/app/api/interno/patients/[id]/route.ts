import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { updatePatient } from "@/lib/patient-service";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await requireInternoModule("cadastros");
    const { id } = await params;
    const body = (await request.json()) as {
      name?: string;
      cpf?: string;
      birthDate?: string;
      phone?: string | null;
      email?: string | null;
      gender?: string | null;
      motherName?: string | null;
      employeeId?: string | null;
      bondType?: string | null;
      companyId?: string | null;
    };

    const result = await updatePatient({
      tenantId: user.tenantId,
      patientId: id,
      name: body.name,
      cpf: body.cpf,
      birthDate: body.birthDate ? new Date(body.birthDate) : undefined,
      phone: body.phone,
      email: body.email,
      gender: body.gender,
      motherName: body.motherName,
      employeeId: body.employeeId,
      bondType: body.bondType,
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
