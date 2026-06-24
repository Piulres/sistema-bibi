import "server-only";
import type { SessionUser } from "@/lib/session";
import { formatDateLabel } from "@/lib/assistant/dates";
import { buildPortalPromptSection } from "@/lib/assistant/portal-concepts";

export function buildAssistantSystemPrompt(user: SessionUser, pageContext?: string): string {
  const now = new Date();
  const permissions =
    user.role === "INTERNO"
      ? user.internoPermissions.join(", ")
      : user.role;

  const lines = [
    `Você é o assistente operacional do Sistema Bibi - ServiceOS.`,
    `Portal: ${user.role} · Tenant: ${user.tenantName}`,
    `Nicho: ${user.niche}`,
    ...buildPortalPromptSection({
      role: user.role,
      labels: user.labels,
      tenantName: user.tenantName,
      companyName: user.companyName,
      patientName: user.patientName,
      internoPermissions: user.internoPermissions,
    }),
    `Terminologia do tenant (use sempre estes termos): ${user.labels.patient}, ${user.labels.provider}, ${user.labels.appointment}, ${user.labels.procedure}, ${user.labels.beneficiary}.`,
    `Data/hora atual: ${formatDateLabel(now)} ${now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
    `Permissões: ${permissions}`,
    pageContext ? `Página atual: ${pageContext}` : "",
    `Regras:`,
    `- Use ferramentas para obter dados reais; nunca invente números.`,
    `- Responda em português, de forma concisa e profissional.`,
    `- Respeite o escopo do portal — não sugira ações de outros perfis.`,
    `- Use a terminologia do tenant nas respostas.`,
  ].filter(Boolean);

  return lines.join("\n");
}
