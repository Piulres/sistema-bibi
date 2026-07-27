import { NextResponse } from "next/server";
import { requirePj, authErrorResponse } from "@/lib/api-auth";
import { createPjBeneficiary } from "@/lib/pj-beneficiary-service";

export async function POST(request: Request) {
  try {
    const user = await requirePj();
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

    if (!body.name?.trim() || !body.cpf?.trim() || !body.birthDate) {
      return NextResponse.json(
        { error: "Informe nome, CPF e data de nascimento" },
        { status: 400 },
      );
    }

    const result = await createPjBeneficiary({
      tenantId: user.tenantId,
      companyId: user.companyId,
      createdBy: user.id,
      data: {
        name: body.name,
        cpf: body.cpf,
        birthDate: new Date(body.birthDate),
        phone: body.phone,
        email: body.email,
        gender: body.gender,
        motherName: body.motherName,
        employeeId: body.employeeId,
        bondType: body.bondType,
      },
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return authErrorResponse(error);
  }
}
