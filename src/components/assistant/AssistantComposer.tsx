"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { useAssistant } from "@/components/assistant/AssistantProvider";
import type { PortalKey } from "@/lib/roles";

const SUGGESTIONS: Record<PortalKey, string[]> = {
  interno: [
    "Agendamentos de hoje",
    "Quantas consultas temos hoje?",
    "Receita de ontem",
    "Quanto faturamos hoje?",
    "Quem está devendo?",
    "Pendências financeiras",
    "Resumo do dashboard",
    "Panorama da operação",
    "Listar usuários",
    "Como criar um paciente?",
    "Como faturar?",
    "Agendamentos hoje e quem deve",
  ],
  prestador: [
    "Minha agenda de hoje",
    "O que tenho hoje?",
    "Resumo do dashboard",
    "Meus pacientes",
    "Carteira de pacientes",
    "Extrato do mês",
    "Quanto recebi?",
    "Próximos pacientes",
  ],
  pj: [
    "Resumo da empresa",
    "Visão geral",
    "Beneficiários da empresa",
    "Colaboradores ativos",
    "Faturas em aberto",
    "O que devemos?",
    "Boletos pendentes",
  ],
  beneficiario: [
    "Meu resumo",
    "Como estou?",
    "Próximos agendamentos",
    "Minha agenda",
    "Minhas faturas",
    "O que devo?",
    "Horários disponíveis hoje",
    "Quero agendar",
  ],
};

type Props = {
  portal: PortalKey;
};

export default function AssistantComposer({ portal }: Props) {
  const { sendMessage, loading } = useAssistant();
  const [input, setInput] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    const value = input;
    setInput("");
    await sendMessage(value);
  }

  const chips = SUGGESTIONS[portal] ?? SUGGESTIONS.interno;

  return (
    <div className="border-t border-[var(--border-muted)] bg-[var(--surface-card)] p-3">
      <div className="mb-2 flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
        {chips.map((chip) => (
          <button
            key={chip}
            type="button"
            disabled={loading}
            onClick={() => void sendMessage(chip)}
            className="rounded-full border border-[var(--border-muted)] px-2.5 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] disabled:opacity-50"
          >
            {chip}
          </button>
        ))}
      </div>
      <form onSubmit={(e) => void handleSubmit(e)} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pergunte ou peça uma ação…"
          disabled={loading}
          className="min-w-0 flex-1 rounded-lg border border-[var(--border-muted)] bg-[var(--surface-page)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
          aria-label="Mensagem para o assistente"
        />
        <Button type="submit" size="sm" disabled={loading || !input.trim()}>
          Enviar
        </Button>
      </form>
    </div>
  );
}
