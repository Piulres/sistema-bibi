import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { createCompany, isCompanyStatus, listCompanies } from "@/lib/company-service";

export async function GET() {
  try {
    const user = await requireUser(["INTERNO"]);
    const companies = await listCompanies(user.tenantId);
    return NextResponse.json({ companies });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(["INTERNO"]);
    const body = (await request.json()) as {
      name?: string;
      cnpj?: string;
      status?: string;
      contractActive?: boolean;
    };

    if (!body.name?.trim() || !body.cnpj?.trim()) {
      return NextResponse.json({ error: "Informe nome e CNPJ" }, { status: 400 });
    }
    if (body.status && !isCompanyStatus(body.status)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }

    const result = await createCompany({
      tenantId: user.tenantId,
      name: body.name,
      cnpj: body.cnpj,
      status: body.status,
      contractActive: body.contractActive,
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
