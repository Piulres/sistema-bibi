import "server-only";
import type { SessionUser } from "@/lib/session";
import { formatDateLabel } from "@/lib/assistant/dates";

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
    `Terminologia: ${user.labels.patient} (paciente), ${user.labels.provider} (prestador), ${user.labels.appointment} (agendamento), ${user.labels.procedure} (procedimento), ${user.labels.beneficiary} (beneficiário).`,
    `Data/hora atual: ${formatDateLabel(now)} ${now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
    `Permissões: ${permissions}`,
    pageContext ? `Página atual: ${pageContext}` : "",
    `Regras:`,
    `- Use ferramentas para obter dados reais; nunca invente números.`,
    `- Responda em português, de forma concisa e profissional.`,
    `- Use a terminologia do tenant nas respostas.`,
  ].filter(Boolean);

  return lines.join("\n");
}
