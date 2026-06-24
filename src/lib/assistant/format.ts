import "server-only";
import type { AssistantAction } from "@/lib/assistant/types";
import type { SessionUser } from "@/lib/session";
import { isDraftToolResult, isIncompleteDraftResult, isChoiceDraftResult } from "@/lib/assistant/types";
import {
  confirmPrompt,
  emptyInvoices,
  emptyListResult,
  emptyOpenInvoices,
  emptySearchResult,
  emptySlots,
} from "@/lib/assistant/humanize";

export function formatToolResult(
  toolName: string,
  result: unknown,
  labels: SessionUser["labels"],
): string | null {
  if (isDraftToolResult(result)) {
    return `${result.preview}\n\n${confirmPrompt()}`;
  }

  if (isIncompleteDraftResult(result)) {
    return result.guidance;
  }

  if (isChoiceDraftResult(result)) {
    return result.question;
  }

  if (typeof result === "object" && result !== null && "error" in result) {
    return String((result as { error: string }).error);
  }

  switch (toolName) {
    case "get_dashboard_kpis": {
      const data = result as {
        generatedAtLabel: string;
        kpis: {
          appointmentsToday: number;
          totalPatients: number;
          totalCompanies: number;
          pendingBillingLabel: string;
          totalInvoicedLabel: string;
          activeSubscriptions: number;
        };
        revenue: { invoicedPaidLabel: string; invoicedOpenLabel: string };
      };
      return [
        `Indicadores atualizados em ${data.generatedAtLabel}:`,
        `• ${labels.appointment}s hoje: **${data.kpis.appointmentsToday}**`,
        `• Total de ${labels.patients}: ${data.kpis.totalPatients}`,
        `• Empresas: ${data.kpis.totalCompanies}`,
        `• Faturamento pendente: ${data.kpis.pendingBillingLabel}`,
        `• Total faturado: ${data.kpis.totalInvoicedLabel}`,
        `• Receita paga: ${data.revenue.invoicedPaidLabel} · Em aberto: ${data.revenue.invoicedOpenLabel}`,
        `• Assinaturas ativas: ${data.kpis.activeSubscriptions}`,
      ].join("\n");
    }
    case "count_appointments":
    case "list_my_appointments": {
      const data = result as {
        dateLabel?: string;
        count: number;
        cancelled?: number;
        sample?: { time: string; patient: string; provider: string; status: string }[];
        appointments?: { scheduledAtLabel: string; patientName: string; status: string }[];
      };
      const dateLabel = data.dateLabel ?? "período";
      const lines = [`Em **${dateLabel}** há **${data.count}** ${labels.appointment.toLowerCase()}(s)`];
      if (data.cancelled) lines.push(`(${data.cancelled} cancelado(s))`);
      const sample = data.sample ?? data.appointments?.map((a) => ({
        time: a.scheduledAtLabel,
        patient: a.patientName,
        provider: "",
        status: a.status,
      }));
      if (sample?.length) {
        lines.push("", "Próximos:");
        for (const item of sample.slice(0, 8)) {
          lines.push(
            `• ${item.time} — ${item.patient}${item.provider ? ` com ${item.provider}` : ""} (${item.status})`,
          );
        }
      }
      return lines.join("\n");
    }
    case "get_revenue_summary": {
      const data = result as {
        fromLabel: string;
        toLabel: string;
        invoicedTotalLabel: string;
        paidTotalLabel: string;
        openTotalLabel: string;
        pendingPayPerUseLabel: string;
        invoiceCount: number;
      };
      const period =
        data.fromLabel === data.toLabel ? data.fromLabel : `${data.fromLabel} a ${data.toLabel}`;
      return [
        `Receita em **${period}**:`,
        `• Faturado: **${data.invoicedTotalLabel}** (${data.invoiceCount} fatura(s))`,
        `• Pago: ${data.paidTotalLabel} · Em aberto: ${data.openTotalLabel}`,
        `• Pay Per Use pendente: ${data.pendingPayPerUseLabel}`,
      ].join("\n");
    }
    case "list_debtors": {
      const data = result as {
        count: number;
        totalLabel: string;
        debtors: { patientName: string; amountLabel: string; detail: string }[];
      };
      if (data.count === 0) return `Não há ${labels.patients.toLowerCase()} com pendências.`;
      const lines = [`**${data.count}** pendência(s) — total: **${data.totalLabel}**`, ""];
      for (const d of data.debtors) lines.push(`• **${d.patientName}** — ${d.amountLabel} (${d.detail})`);
      return lines.join("\n");
    }
    case "list_users": {
      const data = result as { count: number; users: { name: string; email: string; role: string }[] };
      if (data.count === 0) return emptyListResult("usuários");
      return [
        `**${data.count}** usuário(s):`,
        ...data.users.map((u) => `• ${u.name} (${u.email}) — ${u.role}`),
      ].join("\n");
    }
    case "search_patients": {
      const data = result as {
        count: number;
        guidance?: string;
        patients: { name: string; cpf: string; companyName: string | null }[];
      };
      if (data.guidance) return data.guidance;
      if (!data.patients.length) return emptySearchResult(labels);
      return [
        `**${data.count}** resultado(s):`,
        ...data.patients.map((p) => {
          const extra = p.companyName ? ` · ${p.companyName}` : "";
          return `• **${p.name}** — CPF ${p.cpf}${extra}`;
        }),
      ].join("\n");
    }
    case "list_my_patients":
    case "list_company_beneficiaries": {
      const data = result as {
        count: number;
        patients?: { name: string; cpf: string; companyName?: string | null }[];
        beneficiaries?: { name: string; cpf: string; consumedLabel: string }[];
      };
      const items = data.patients ?? data.beneficiaries ?? [];
      if (data.count === 0) return emptyListResult(labels.patients);
      return [
        `**${data.count}** resultado(s):`,
        ...items.slice(0, 10).map((p) => {
          const extra = "consumedLabel" in p ? ` — ${p.consumedLabel}` : p.companyName ? ` · ${p.companyName}` : "";
          return `• **${p.name}** — CPF ${p.cpf}${extra}`;
        }),
      ].join("\n");
    }
    case "explain_capability": {
      const data = result as { answer: string };
      return data.answer;
    }
    case "get_prestador_dashboard": {
      const data = result as {
        generatedAtLabel: string;
        kpis: {
          appointmentsToday: number;
          confirmedToday: number;
          completedToday: number;
          revenueWeekLabel: string;
        };
        nextAppointment: { patientName: string; scheduledAtLabel: string } | null;
      };
      const lines = [
        `Sua agenda (${data.generatedAtLabel}):`,
        `• Hoje: **${data.kpis.appointmentsToday}** ${labels.appointment.toLowerCase()}(s)`,
        `• Confirmados: ${data.kpis.confirmedToday} · Realizados: ${data.kpis.completedToday}`,
        `• Receita da semana: ${data.kpis.revenueWeekLabel}`,
      ];
      if (data.nextAppointment) {
        lines.push(
          `• Próximo: **${data.nextAppointment.patientName}** às ${data.nextAppointment.scheduledAtLabel}`,
        );
      }
      return lines.join("\n");
    }
    case "get_extrato_summary": {
      const data = result as {
        periodLabel: string;
        summary: { proceduresCount: number; revenueLabel: string };
      };
      return `Extrato (${data.periodLabel}): **${data.summary.revenueLabel}** em ${data.summary.proceduresCount} procedimento(s).`;
    }
    case "get_pj_overview": {
      const data = result as {
        company: { name: string; beneficiariesCount: number; pendingInvoicesLabel: string };
        summary: { openInvoicesCount: number; openInvoicesTotalLabel: string; activeSubscriptions: number };
      };
      return [
        `Empresa **${data.company.name}**:`,
        `• ${labels.beneficiaries}: ${data.company.beneficiariesCount}`,
        `• Faturas em aberto: ${data.summary.openInvoicesCount} (${data.summary.openInvoicesTotalLabel})`,
        `• Assinaturas ativas: ${data.summary.activeSubscriptions}`,
        `• Pendências: ${data.company.pendingInvoicesLabel}`,
      ].join("\n");
    }
    case "get_open_invoices": {
      const data = result as {
        count: number;
        totalLabel: string;
        invoices: { patientName: string; totalLabel: string; status: string }[];
      };
      if (data.count === 0) return emptyOpenInvoices();
      return [
        `**${data.count}** fatura(s) em aberto — total **${data.totalLabel}**`,
        ...data.invoices.map((i) => `• ${i.patientName}: ${i.totalLabel} (${i.status})`),
      ].join("\n");
    }
    case "get_my_overview": {
      const data = result as {
        patientName: string;
        nextAppointment: { scheduledAtLabel: string; providerName: string } | null;
        openInvoices: number;
        subscriptions: number;
      };
      const lines = [`Olá, **${data.patientName}**!`];
      if (data.nextAppointment) {
        lines.push(
          `• Próximo ${labels.appointment.toLowerCase()}: ${data.nextAppointment.scheduledAtLabel} com ${data.nextAppointment.providerName}`,
        );
      }
      lines.push(`• Faturas em aberto: ${data.openInvoices} · Assinaturas: ${data.subscriptions}`);
      return lines.join("\n");
    }
    case "list_my_invoices": {
      const data = result as {
        count: number;
        invoices: { totalLabel: string; status: string; createdAtLabel: string }[];
      };
      if (data.count === 0) return emptyInvoices();
      return data.invoices.map((i) => `• ${i.createdAtLabel}: ${i.totalLabel} (${i.status})`).join("\n");
    }
    case "list_available_slots": {
      const data = result as { date: string; slots: { label: string }[] };
      if (!data.slots.length) return emptySlots(data.date);
      return [`Horários em ${data.date}:`, ...data.slots.map((s) => `• ${s.label}`)].join("\n");
    }
    default:
      return null;
  }
}

export function buildActions(
  toolName: string,
  result: unknown,
  role: string,
  labels?: SessionUser["labels"],
): AssistantAction[] {
  if (isDraftToolResult(result)) {
    const actions: AssistantAction[] = [
      {
        type: "confirm",
        title: result.preview,
        summary: result.summary,
        pendingActionId: result.pendingActionId,
      },
    ];
    if (result.href) {
      actions.push({ type: "link", label: "Abrir formulário", href: result.href });
    }
    return actions;
  }

  if (isChoiceDraftResult(result)) {
    return [
      {
        type: "choice",
        title: result.fieldLabel,
        field: result.field,
        options: result.options.map((option, index) => ({
          label: `${index + 1}. ${option.label}${option.detail ? ` (${option.detail})` : ""}`,
          value: String(index + 1),
        })),
      },
    ];
  }

  if (toolName === "list_debtors") {
    const data = result as { debtors: { patientName: string; amountLabel: string; detail: string }[] };
    if (!data.debtors?.length) return [];
    return [
      {
        type: "table",
        title: "Pendências financeiras",
        columns: [labels?.beneficiary ?? "Beneficiário", "Valor", "Detalhe"],
        rows: data.debtors.map((d) => [d.patientName, d.amountLabel, d.detail]),
      },
      { type: "link", label: "Abrir faturamento", href: "/interno" },
    ];
  }

  const links: Record<string, { label: string; href: string }> = {
    count_appointments: { label: "Ver agenda", href: "/interno/agenda" },
    get_revenue_summary: { label: "Ver relatórios", href: "/interno/relatorios" },
    get_dashboard_kpis: { label: "Dashboard", href: "/interno/dashboard" },
    list_users: { label: "Cadastros", href: "/interno/cadastros" },
    get_prestador_dashboard: { label: "Minha agenda", href: "/prestador" },
    get_extrato_summary: { label: "Extrato", href: "/prestador/extrato" },
    get_pj_overview: { label: "Portal PJ", href: "/pj" },
    get_open_invoices: { label: "Faturas", href: "/pj#faturas" },
    get_my_overview: { label: "Meu resumo", href: "/beneficiario/resumo" },
    list_available_slots: { label: "Agendar", href: "/beneficiario/agendar" },
  };

  if (toolName === "list_my_appointments") {
    const href = role === "BENEFICIARIO" ? "/beneficiario/agenda" : "/prestador";
    return [{ type: "link", label: "Ver agenda", href }];
  }

  const link = links[toolName];
  return link ? [link] : [];
}
