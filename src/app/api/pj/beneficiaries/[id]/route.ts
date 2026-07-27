import { NextResponse } from "next/server";
import { requirePj, authErrorResponse } from "@/lib/api-auth";
import { detachPjBeneficiary, updatePjBeneficiary } from "@/lib/pj-beneficiary-service";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await requirePj();
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
    };

    const result = await updatePjBeneficiary({
      tenantId: user.tenantId,
      companyId: user.companyId,
      patientId: id,
      createdBy: user.id,
      data: {
        name: body.name,
        cpf: body.cpf,
        birthDate: body.birthDate ? new Date(body.birthDate) : undefined,
        phone: body.phone,
        email: body.email,
        gender: body.gender,
        motherName: body.motherName,
        employeeId: body.employeeId,
        bondType: body.bondType,
      },
    });

    if ("error" in result) {
      const message = result.error ?? "Não foi possível atualizar";
      const status = message.includes("não encontrado") ? 404 : 400;
      return NextResponse.json({ error: message }, { status });
    }

    return NextResponse.json(result);
  } catch (error) {
    return authErrorResponse(error);
  }
}

/** Desvincula colaborador da empresa (sem excluir cadastro clínico). */
export async function DELETE(_request: Request, { params }: Params) {
  try {
    const user = await requirePj();
    const { id } = await params;

    const result = await detachPjBeneficiary({
      tenantId: user.tenantId,
      companyId: user.companyId,
      patientId: id,
      createdBy: user.id,
    });

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error ?? "Beneficiário não encontrado na empresa" },
        { status: 404 },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    return authErrorResponse(error);
  }
}
