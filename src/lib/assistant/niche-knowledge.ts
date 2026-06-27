import "server-only";
import type { NicheId } from "@/lib/niche/types";
import type { NicheLabels } from "@/lib/niche/types";
import type { KnowledgeChunk } from "@/lib/assistant/rag/knowledge";

type NicheSnippet = {
  niche: NicheId;
  title: string;
  content: string;
  tags: string[];
};

/** Snippets RAG por segmento — padrão Intercom Fin / vertical SaaS. */
const NICHE_SNIPPETS: NicheSnippet[] = [
  {
    niche: "MEDICAL",
    title: "Agendamento clínico",
    content:
      "No portal Interno use Agenda para marcar consultas. O assistente pode preparar agendamentos com confirmação. Beneficiários agendam em Agendar escolhendo prestador e horário.",
    tags: ["agendar", "consulta", "agenda", "marcar"],
  },
  {
    niche: "VET",
    title: "Atendimento PetCare",
    content:
      "No segmento veterinário o cadastro tem Tutor (responsável) e Pet. Ao agendar um atendimento, informe o tutor e o pet — ex.: *marcar banho para o pet Thor do tutor João amanhã às 10h*. Ficha clínica, vacinas e medicação ficam na ficha do pet.",
    tags: ["pet", "tutor", "atendimento", "agendar", "banho", "tosa", "vacina"],
  },
  {
    niche: "DENTAL",
    title: "Consulta odontológica",
    content:
      "Agende consultas odontológicas pela Agenda interna ou self-service do beneficiário. Procedimentos do catálogo incluem limpeza, restauração e ortodontia conforme o tenant.",
    tags: ["odontológica", "dente", "consulta", "agendar"],
  },
  {
    niche: "LEGAL",
    title: "Atendimento jurídico",
    content:
      "Clientes e advogados usam os mesmos fluxos de agenda e faturamento Pay Per Use. Marque atendimentos por hora ou serviço jurídico do catálogo. O assistente lista clientes e prepara agendamentos com confirmação.",
    tags: ["cliente", "advogado", "hora", "jurídico", "atendimento"],
  },
  {
    niche: "SPA",
    title: "Agendamento de sessões",
    content:
      "Profissionais e clientes agendam sessões e pacotes pelo portal. Use o assistente para ver horários, faturas e resumo da operação.",
    tags: ["sessão", "agendamento", "cliente", "profissional", "spa"],
  },
  {
    niche: "EDUCATION",
    title: "Aulas e matrículas",
    content:
      "Alunos e instrutores usam agenda de aulas. O assistente mostra próximas aulas, extrato do instrutor e permite preparar agendamentos de aula com confirmação.",
    tags: ["aula", "aluno", "instrutor", "agendar", "matrícula"],
  },
  {
    niche: "CONSTRUCTION",
    title: "Obras e empreiteira",
    content:
      "No segmento Engenharia Civil use Projetos/Obras para pipeline comercial, orçamento, cronograma e RDO. O assistente ajuda com resumo da operação; agendamentos seguem o catálogo do tenant. Prestadores registram diário de campo em Campo.",
    tags: ["obra", "projeto", "rdo", "campo", "orçamento", "empreiteira", "engenharia"],
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

export function searchNicheKnowledge(
  niche: NicheId,
  query: string,
  labels: NicheLabels,
  limit = 2,
): KnowledgeChunk[] {
  const tokens = tokenize(`${query} ${Object.values(labels).join(" ")}`);
  const hits = NICHE_SNIPPETS.filter((s) => s.niche === niche)
    .map((snippet) => {
      const hay = tokenize(`${snippet.title} ${snippet.content} ${snippet.tags.join(" ")}`);
      const score = tokens.reduce((sum, t) => sum + (hay.includes(t) ? 1 : 0), 0);
      return { snippet, score };
    })
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return hits.map((h, i) => ({
    id: `niche-${niche}-${i}`,
    title: h.snippet.title,
    content: h.snippet.content,
    source: `niche-${niche}`,
  }));
}
