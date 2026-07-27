import "server-only";
import type { Role } from "@/lib/roles";
import type { SessionUser } from "@/lib/session";
import { formatDateLabel } from "@/lib/assistant/dates";
import { formatTimeBR } from "@/lib/timezone";
import { buildPortalPromptSection } from "@/lib/assistant/portal-concepts";

export type AssistantSystemPromptOptions = {
  pageContext?: string;
  /** Modo híbrido (Fase 4): restringe tools que o LLM pode chamar. */
  mode?: "rules" | "ai";
  allowedToolNames?: readonly string[];
};

export function buildAssistantSystemPrompt(
  user: SessionUser,
  pageContextOrOptions?: string | AssistantSystemPromptOptions,
): string {
  const options: AssistantSystemPromptOptions =
    typeof pageContextOrOptions === "string" || pageContextOrOptions === undefined
      ? { pageContext: pageContextOrOptions }
      : pageContextOrOptions;

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
      role: user.role as Role,
      labels: user.labels,
      tenantName: user.tenantName,
      companyName: user.companyName,
      patientName: user.patientName,
      internoPermissions: user.internoPermissions,
    }),
    `Terminologia do tenant (use sempre estes termos): ${user.labels.patient}, ${user.labels.provider}, ${user.labels.appointment}, ${user.labels.procedure}, ${user.labels.beneficiary}.`,
    `Data/hora atual: ${formatDateLabel(now)} ${formatTimeBR(now)}`,
    `Permissões: ${permissions}`,
    options.pageContext ? `Página atual: ${options.pageContext}` : "",
    options.mode === "ai" ? `Modo: IA híbrida — suas tool calls serão validadas pelo motor de regras do tenant.` : "",
    options.allowedToolNames?.length
      ? `Ferramentas permitidas (somente estas): ${options.allowedToolNames.join(", ")}.`
      : "",
    `Regras:`,
    `- Use ferramentas para obter dados reais; nunca invente números.`,
    `- Responda em português, de forma concisa e profissional.`,
    `- Respeite o escopo do portal — não sugira ações de outros perfis.`,
    `- Use a terminologia do tenant nas respostas.`,
    `- Não chame ferramentas fora da lista permitida.`,
  ].filter(Boolean);

  return lines.join("\n");
}
