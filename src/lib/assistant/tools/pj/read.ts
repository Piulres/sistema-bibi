import "server-only";
import type { AssistantToolDefinition } from "@/lib/assistant/types";
import { getPjPortalOverview } from "@/lib/pj-portal-service";

export const pjReadTools: AssistantToolDefinition[] = [
  {
    name: "get_pj_overview",
    description: "Visão geral da empresa: beneficiários, faturas, assinaturas e alertas.",
    parameters: { type: "object", properties: {} },
    requiredRoles: ["PJ"],
    handler: async (ctx) => {
      if (!ctx.user.companyId) return { error: "Conta sem empresa vinculada." };
      const overview = await getPjPortalOverview(ctx.user.companyId, ctx.user.tenantId);
      if (!overview) return { error: "Empresa não encontrada." };
      return overview;
    },
  },
  {
    name: "list_company_beneficiaries",
    description: "Lista beneficiários da empresa com consumo.",
    parameters: {
      type: "object",
      properties: {
        search: { type: "string" },
      },
    },
    requiredRoles: ["PJ"],
    handler: async (ctx, args) => {
      if (!ctx.user.companyId) return { error: "Conta sem empresa vinculada." };
      const overview = await getPjPortalOverview(ctx.user.companyId, ctx.user.tenantId);
      if (!overview) return { error: "Empresa não encontrada." };
      const search = ((args as { search?: string }).search ?? "").toLowerCase();
      let beneficiaries = overview.beneficiaries;
      if (search) {
        beneficiaries = beneficiaries.filter(
          (b) => b.name.toLowerCase().includes(search) || b.cpf.includes(search),
        );
      }
      return { count: beneficiaries.length, beneficiaries: beneficiaries.slice(0, 15) };
    },
  },
  {
    name: "get_open_invoices",
    description: "Faturas em aberto da empresa.",
    parameters: { type: "object", properties: {} },
    requiredRoles: ["PJ"],
    handler: async (ctx) => {
      if (!ctx.user.companyId) return { error: "Conta sem empresa vinculada." };
      const overview = await getPjPortalOverview(ctx.user.companyId, ctx.user.tenantId);
      if (!overview) return { error: "Empresa não encontrada." };
      const open = overview.invoices.filter((inv) => inv.status === "FECHADA");
      return {
        count: open.length,
        totalLabel: overview.summary.openInvoicesTotalLabel,
        invoices: open.slice(0, 10),
      };
    },
  },
];
