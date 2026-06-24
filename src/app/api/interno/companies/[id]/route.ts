import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { updateCompany } from "@/lib/company-service";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await requireInternoModule("cadastros");
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;

    if (body.status !== undefined) {
      return NextResponse.json(
        { error: "Alteração de status CRM deve usar o endpoint dedicado" },
        { status: 403 },
      );
    }

    const contractActive =
      body.contractActive !== undefined ? Boolean(body.contractActive) : undefined;

    const result = await updateCompany({
      tenantId: user.tenantId,
      companyId: id,
      name: body.name ? String(body.name) : undefined,
      cnpj: body.cnpj ? String(body.cnpj) : undefined,
      contractActive,
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
