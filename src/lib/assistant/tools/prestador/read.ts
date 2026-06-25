import "server-only";
import type { AssistantToolDefinition } from "@/lib/assistant/types";
import { getPrestadorDashboard } from "@/lib/prestador-dashboard";
import { listAppointments } from "@/lib/appointment-service";
import { getPrestadorExtrato } from "@/lib/prestador-extrato";
import { dayRange, formatDateLabel, parseAssistantDate } from "@/lib/assistant/dates";
import { getPrisma } from "@/lib/db";

export const prestadorReadTools: AssistantToolDefinition[] = [
  {
    name: "get_prestador_dashboard",
    description: "KPIs do prestador logado: agenda do dia, fila, receita da semana.",
    parameters: { type: "object", properties: {} },
    requiredRoles: ["PRESTADOR"],
    handler: async (ctx) => getPrestadorDashboard(ctx.user.tenantId, ctx.user.id),
  },
  {
    name: "list_my_appointments",
    description: "Lista agendamentos do prestador em uma data.",
    parameters: {
      type: "object",
      properties: {
        date: { type: "string", description: "hoje, ontem, YYYY-MM-DD" },
      },
    },
    requiredRoles: ["PRESTADOR"],
    handler: async (ctx, args) => {
      const date = parseAssistantDate((args as { date?: string }).date);
      const { from, to } = dayRange(date);
      const appointments = await listAppointments({
        tenantId: ctx.user.tenantId,
        providerId: ctx.user.id,
        from,
        to,
      });
      return {
        dateLabel: formatDateLabel(date),
        count: appointments.length,
        appointments: appointments.slice(0, 12),
      };
    },
  },
  {
    name: "list_my_patients",
    description: "Lista pacientes atendidos pelo prestador.",
    parameters: {
      type: "object",
      properties: {
        search: { type: "string" },
      },
    },
    requiredRoles: ["PRESTADOR"],
    handler: async (ctx, args) => {
      const prisma = await getPrisma();
      const search = ((args as { search?: string }).search ?? "").toLowerCase();
      const rows = await prisma.appointment.findMany({
        where: { tenantId: ctx.user.tenantId, providerId: ctx.user.id },
        distinct: ["patientId"],
        include: { patient: { select: { id: true, name: true, cpf: true, phone: true } } },
        take: 30,
      });
      let patients = rows.map((r) => r.patient);
      if (search) {
        patients = patients.filter(
          (p) => p.name.toLowerCase().includes(search) || p.cpf.includes(search),
        );
      }
      return { count: patients.length, patients: patients.slice(0, 10) };
    },
  },
  {
    name: "get_extrato_summary",
    description: "Resumo financeiro do extrato do prestador no período.",
    parameters: {
      type: "object",
      properties: {
        from: { type: "string" },
        to: { type: "string" },
      },
    },
    requiredRoles: ["PRESTADOR"],
    handler: async (ctx, args) => {
      const { from, to } = args as { from?: string; to?: string };
      const extrato = await getPrestadorExtrato(
        ctx.user.tenantId,
        ctx.user.id,
        from ? toIsoDate(parseAssistantDate(from)) : undefined,
        to ? toIsoDate(parseAssistantDate(to)) : undefined,
      );
      return extrato;
    },
  },
];

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
