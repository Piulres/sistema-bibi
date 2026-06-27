/**
 * Simula conversa de agendamento pelo assistente (portal Interno).
 * Uso: npx tsx scripts/simulate-appointment-chat.ts
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
require.cache[require.resolve("server-only")] = {
  id: "server-only",
  filename: "server-only",
  loaded: true,
  exports: {},
} as NodeModule;

async function main() {
  const { getPrisma } = await import("../src/lib/db");
  const { runAssistantChat } = await import("../src/lib/assistant/runner");
  const { executePendingAction } = await import("../src/lib/assistant/confirm-executor");
  const { consumePendingAction } = await import("../src/lib/assistant/pending-actions");
  const { clearMockContext } = await import("../src/lib/assistant/provider/mock-context");
  const { resolveInternoPermissions } = await import("../src/lib/interno-permissions");
  const { mergeNicheLabels } = await import("../src/lib/niche/labels");
  const { applyNicheBrandingDefaults } = await import("../src/lib/niche/branding");
  const { LOGIN_PORTAL_BRANDING } = await import("../src/lib/theme/tokens");
  const { isNicheId } = await import("../src/lib/niche/types");
  type AssistantMessage = import("../src/lib/assistant/types").AssistantMessage;
  type SessionUser = import("../src/lib/session").SessionUser;

  function line(who: "Recepção" | "Assistente", text: string) {
    console.log(`\n**${who}:** ${text}`);
  }

  function divider(n: number) {
    console.log(`\n${"─".repeat(60)}\nTurno ${n}`);
  }

  const prisma = await getPrisma();
  const dbUser = await prisma.user.findFirst({
    where: { email: "recepcao@bibi.health" },
    include: { tenant: { include: { branding: true } } },
  });
  if (!dbUser?.tenant) throw new Error("Usuário recepcao@bibi.health não encontrado no seed.");

  const niche = isNicheId(dbUser.tenant.niche) ? dbUser.tenant.niche : "MEDICAL";
  const user: SessionUser = {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role,
    tenantId: dbUser.tenantId,
    tenantSlug: dbUser.tenant.slug,
    companyId: dbUser.companyId,
    patientId: dbUser.patientId,
    tenantName: dbUser.tenant.name,
    companyName: null,
    patientName: null,
    internoProfile: dbUser.internoProfile,
    internoPermissions: resolveInternoPermissions(dbUser.role, dbUser.internoProfile),
    branding: applyNicheBrandingDefaults(niche, {
      ...LOGIN_PORTAL_BRANDING,
      displayName: dbUser.tenant.name,
    }),
    niche,
    labels: mergeNicheLabels(niche, dbUser.tenant.labels),
  };

  clearMockContext(user.id);
  const messages: AssistantMessage[] = [];
  let sessionState: string | undefined;

  console.log("═".repeat(60));
  console.log("SIMULAÇÃO — Agendamento via chat (mock ativo)");
  console.log(`Portal: Interno · Usuário: ${user.name} <${user.email}>`);
  console.log(`Tenant: ${user.tenantName} (${user.tenantSlug}) · Nicho: ${user.niche}`);
  console.log("═".repeat(60));

  const turns = [
    "oi, preciso marcar uma consulta",
    "é pro João Pereira",
    "amanhã às 11h com a Dra Helena",
    "__CONFIRM__",
  ];
  let pendingId: string | undefined;
  let confirmed = false;

  for (let i = 0; i < turns.length; i++) {
    divider(i + 1);
    const userText = turns[i]!;
    line("Recepção", userText === "__CONFIRM__" ? "[clica Confirmar no card]" : userText);

    if (userText === "__CONFIRM__" && pendingId) {
      const payload = consumePendingAction(pendingId, user.id, user.tenantId);
      if (!payload) {
        line("Assistente", "Ação expirada ou inválida.");
        continue;
      }
      const result = await executePendingAction(user, payload);
      if (result.ok) {
        line("Assistente", result.message.replace(/\*\*/g, ""));
        line("Assistente", `Link: ${result.href} · ID: ${result.entityId}`);
        confirmed = true;
      } else {
        line("Assistente", `Erro: ${result.error}`);
      }
      continue;
    }

    messages.push({ role: "user", content: userText });

    const result = await runAssistantChat({
      user,
      messages,
      pageContext: "/interno/agenda",
      sessionState,
    });
    sessionState = result.sessionState;
    messages.push(result.message);
    line("Assistente", result.message.content);

    const card = result.actions?.find((a) => a.type === "confirm");
    if (card && card.type === "confirm") {
      pendingId = card.pendingActionId;
      const summary = Object.entries(card.summary)
        .map(([k, v]) => `  • ${k}: ${v}`)
        .join("\n");
      line(
        "Assistente",
        `[Card na UI]\n${card.title}\n${summary}\n  → botões: Confirmar | Cancelar`,
      );
    }

    const choice = result.actions?.find((a) => a.type === "choice");
    if (choice && choice.type === "choice") {
      const options = choice.options.map((o) => `  [ ${o.label} ]`).join("\n");
      line("Assistente", `[Botões de escolha — ${choice.title}]\n${options}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`Portal: Interno · ${user.email} · ${user.tenantName}`);
  console.log(confirmed ? "✅ Consulta marcada no banco." : "❌ Agendamento não concluído.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
