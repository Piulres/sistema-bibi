import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { createPatient, listPatients } from "@/lib/patient-service";

export async function GET() {
  try {
    const user = await requireUser(["INTERNO"]);
    const patients = await listPatients(user.tenantId);
    return NextResponse.json({ patients });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(["INTERNO"]);
    const body = (await request.json()) as {
      name?: string;
      cpf?: string;
      birthDate?: string;
      phone?: string | null;
      companyId?: string | null;
    };

    if (!body.name?.trim() || !body.cpf?.trim() || !body.birthDate) {
      return NextResponse.json({ error: "Informe nome, CPF e data de nascimento" }, { status: 400 });
    }

    const result = await createPatient({
      tenantId: user.tenantId,
      name: body.name,
      cpf: body.cpf,
      birthDate: new Date(body.birthDate),
      phone: body.phone,
      companyId: body.companyId,
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
