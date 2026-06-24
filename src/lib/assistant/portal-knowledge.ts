import "server-only";
import type { Role } from "@/lib/roles";
import type { NicheLabels } from "@/lib/niche/types";
import { searchKnowledge, type KnowledgeChunk } from "@/lib/assistant/rag/knowledge";

type PortalSnippet = {
  roles: Role[];
  title: string;
  content: string;
  tags: string[];
};

const PORTAL_SNIPPETS: PortalSnippet[] = [
  {
    roles: ["PRESTADOR"],
    title: "Agenda do prestador",
    content:
      "No portal Prestador use a aba Agenda para ver atendimentos do dia. Em Atendimento, abra o PEP, registre procedimentos (Pay Per Use) e finalize a consulta.",
    tags: ["agenda", "atendimento", "pep", "procedimento", "consulta"],
  },
  {
    roles: ["PRESTADOR"],
    title: "Extrato financeiro",
    content:
      "O extrato mostra procedimentos realizados e valores a receber. Pergunte ao assistente: extrato do mês ou quanto recebi.",
    tags: ["extrato", "financeiro", "recebi", "ganho", "pagamento"],
  },
  {
    roles: ["PJ"],
    title: "Portal da empresa",
    content:
      "O portal PJ concentra resumo do contrato, beneficiários ativos, assinaturas e faturas corporativas. Use o assistente para ver faturas em aberto ou listar colaboradores.",
    tags: ["empresa", "pj", "contrato", "resumo", "rh"],
  },
  {
    roles: ["PJ"],
    title: "Faturas corporativas",
    content:
      "Faturas com status FECHADA estão aguardando pagamento. O assistente lista pendências; o pagamento é feito pelo financeiro da empresa conforme o contrato.",
    tags: ["fatura", "boleto", "pagar", "aberto", "pendente"],
  },
  {
    roles: ["BENEFICIARIO"],
    title: "Agendar atendimento",
    content:
      "Em Agendar, escolha procedimento (opcional), data e horário. Você pode marcar sem preferência de prestador — o sistema mostra horários de todos os profissionais disponíveis.",
    tags: ["agendar", "marcar", "horario", "consulta", "prestador"],
  },
  {
    roles: ["BENEFICIARIO"],
    title: "Faturas e PIX",
    content:
      "Em Faturas, gere PIX para cobranças em aberto. O assistente mostra resumo da conta e próximos agendamentos.",
    tags: ["fatura", "pix", "pagar", "boleto", "cobranca"],
  },
];

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .split(/[^a-z0-9à-ú]+/i)
    .filter((t) => t.length > 2);
}

export function searchPortalKnowledge(
  role: Role,
  query: string,
  labels: NicheLabels,
  limit = 3,
): KnowledgeChunk[] {
  const tokens = tokenize(query);
  const labelText = Object.values(labels).join(" ");
  const global = searchKnowledge(`${query} ${labelText}`, limit);

  const portalHits = PORTAL_SNIPPETS.filter((snippet) => snippet.roles.includes(role))
    .map((snippet) => {
      const hay = tokenize(`${snippet.title} ${snippet.content} ${snippet.tags.join(" ")}`);
      const score = tokens.reduce((sum, token) => sum + (hay.includes(token) ? 1 : 0), 0);
      return { snippet, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item, index) => ({
      id: `portal-${role}-${index}`,
      title: item.snippet.title,
      content: item.snippet.content,
      source: `portal-${role.toLowerCase()}`,
    }));

  const merged = [...portalHits];
  for (const chunk of global) {
    if (merged.length >= limit) break;
    if (!merged.some((c) => c.id === chunk.id)) merged.push(chunk);
  }
  return merged.slice(0, limit);
}
