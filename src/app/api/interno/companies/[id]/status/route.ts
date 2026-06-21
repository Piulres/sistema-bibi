import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import {
  companyStatusLabel,
  contractActiveFromStatus,
  isCompanyStatus,
} from "@/lib/company-crm";
import {
  recordTimelineEvent,
  TIMELINE_ACTIONS,
  TIMELINE_ENTITY_TYPES,
} from "@/lib/timeline";
import { dispatchWebhooks } from "@/lib/webhook-service";

/** Atualiza o status CRM de uma empresa (pipeline corporativo). */
export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/interno/companies/[id]/status">,
) {
  try {
    const user = await requireInternoModule("crm");
    const { id } = await ctx.params;
    const body = (await request.json()) as { status?: string };

    if (!body.status || !isCompanyStatus(body.status)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }

    const existing = await prisma.company.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    if (existing.status === body.status) {
      return NextResponse.json({
        company: {
          id: existing.id,
          name: existing.name,
          status: existing.status,
          statusLabel: companyStatusLabel(existing.status),
          contractActive: existing.contractActive,
        },
      });
    }

    const previousLabel = companyStatusLabel(existing.status);
    const nextLabel = companyStatusLabel(body.status);
    const contractActive = contractActiveFromStatus(body.status);

    const company = await prisma.company.update({
      where: { id },
      data: { status: body.status, contractActive },
    });

    await recordTimelineEvent({
      tenantId: user.tenantId,
      entityType: TIMELINE_ENTITY_TYPES.COMPANY,
      entityId: company.id,
      action: TIMELINE_ACTIONS.CONTRACT_CHANGED,
      description: `${company.name}: status alterado de ${previousLabel} para ${nextLabel}`,
      createdBy: user.id,
    });

    void dispatchWebhooks({
      tenantId: user.tenantId,
      event: "COMPANY_STATUS_CHANGED",
      data: {
        companyId: company.id,
        name: company.name,
        from: existing.status,
        to: company.status,
        contractActive: company.contractActive,
      },
    });

    return NextResponse.json({
      company: {
        id: company.id,
        name: company.name,
        status: company.status,
        statusLabel: nextLabel,
        contractActive: company.contractActive,
      },
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
