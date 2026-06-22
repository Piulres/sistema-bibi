import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { createCompany, isCompanyStatus, listCompanies } from "@/lib/company-service";

const companyBodyFields = (body: Record<string, unknown>) => ({
  tradeName: body.tradeName as string | null | undefined,
  email: body.email as string | null | undefined,
  phone: body.phone as string | null | undefined,
  contactName: body.contactName as string | null | undefined,
  contactEmail: body.contactEmail as string | null | undefined,
  contactPhone: body.contactPhone as string | null | undefined,
  addressStreet: body.addressStreet as string | null | undefined,
  addressCity: body.addressCity as string | null | undefined,
  addressState: body.addressState as string | null | undefined,
  addressZip: body.addressZip as string | null | undefined,
});

export async function GET() {
  try {
    const user = await requireInternoModule("cadastros");
    const companies = await listCompanies(user.tenantId);
    return NextResponse.json({ companies });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireInternoModule("cadastros");
    const body = (await request.json()) as Record<string, unknown>;

    if (!String(body.name ?? "").trim() || !String(body.cnpj ?? "").trim()) {
      return NextResponse.json({ error: "Informe razão social e CNPJ" }, { status: 400 });
    }
    if (body.status && !isCompanyStatus(String(body.status))) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }

    const result = await createCompany({
      tenantId: user.tenantId,
      name: String(body.name),
      cnpj: String(body.cnpj),
      status: body.status ? String(body.status) : undefined,
      contractActive: body.contractActive as boolean | undefined,
      createdBy: user.id,
      ...companyBodyFields(body),
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return authErrorResponse(error);
  }
}
