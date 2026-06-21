import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { isCompanyStatus, updateCompany } from "@/lib/company-service";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await requireUser(["INTERNO"]);
    const { id } = await params;
    const body = (await request.json()) as {
      name?: string;
      cnpj?: string;
      status?: string;
      contractActive?: boolean;
    };

    if (body.status && !isCompanyStatus(body.status)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }

    const result = await updateCompany({
      tenantId: user.tenantId,
      companyId: id,
      ...body,
      createdBy: user.id,
    });

    if (!result) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return authErrorResponse(error);
  }
}
