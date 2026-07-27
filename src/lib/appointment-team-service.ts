import "server-only";
import { getPrisma } from "@/lib/db";
import { canRegisterProcedureForStatus } from "@/lib/appointment-status";
import { computePrice, formatBRL } from "@/lib/pricing";
import {
  isTeamRole,
  matchesTeamRole,
  parseTeamRoleRequirements,
  TEAM_ROLE_FEE_PROCEDURE_CODES,
  teamRoleLabel,
  type TeamRole,
} from "@/lib/clinical/team-roles";
import type { NicheId } from "@/lib/niche/types";
import {
  recordTimelineEvent,
  TIMELINE_ACTIONS,
  TIMELINE_ENTITY_TYPES,
} from "@/lib/timeline";

export type ParticipantView = {
  id: string;
  role: string;
  roleLabel: string;
  userId: string;
  userName: string;
  userSpecialty: string | null;
  notes: string | null;
  feeProcedureUsageId: string | null;
  feeLabel: string | null;
  feeAmount: number | null;
  createdAt: string;
};

export type EligibleMemberView = {
  id: string;
  name: string;
  email: string;
  specialty: string | null;
  role: string;
};

function mapParticipant(
  row: {
    id: string;
    role: string;
    notes: string | null;
    createdAt: Date;
    user: { id: string; name: string; specialty: string | null };
    procedureUsage: { id: string; priceCharged: number } | null;
  },
  niche: NicheId,
): ParticipantView {
  return {
    id: row.id,
    role: row.role,
    roleLabel: teamRoleLabel(row.role, niche),
    userId: row.user.id,
    userName: row.user.name,
    userSpecialty: row.user.specialty,
    notes: row.notes,
    feeProcedureUsageId: row.procedureUsage?.id ?? null,
    feeLabel: row.procedureUsage ? formatBRL(row.procedureUsage.priceCharged) : null,
    feeAmount: row.procedureUsage?.priceCharged ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listAppointmentParticipants(
  appointmentId: string,
  tenantId: string,
  niche: NicheId = "MEDICAL",
): Promise<ParticipantView[]> {
  const prisma = await getPrisma();
  const rows = await prisma.appointmentParticipant.findMany({
    where: { appointmentId, appointment: { tenantId } },
    include: {
      user: { select: { id: true, name: true, specialty: true } },
      procedureUsage: { select: { id: true, priceCharged: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((row) => mapParticipant(row, niche));
}

export async function listEligibleTeamMembers(
  tenantId: string,
  teamRole: TeamRole,
  excludeUserIds: string[] = [],
): Promise<EligibleMemberView[]> {
  const prisma = await getPrisma();
  const users = await prisma.user.findMany({
    where: {
      tenantId,
      role: { in: ["PRESTADOR", "INTERNO"] },
      id: excludeUserIds.length ? { notIn: excludeUserIds } : undefined,
    },
    select: { id: true, name: true, email: true, specialty: true, councilType: true, role: true },
    orderBy: { name: "asc" },
  });

  return users
    .filter((user) => matchesTeamRole(user, teamRole))
    .map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      specialty: user.specialty,
      role: user.role,
    }));
}

export async function addAppointmentParticipant(input: {
  appointmentId: string;
  tenantId: string;
  providerId: string;
  userId: string;
  role: string;
  notes?: string | null;
  chargeFee?: boolean;
  niche?: NicheId;
  patientName: string;
}): Promise<ParticipantView> {
  if (!isTeamRole(input.role)) {
    throw new Error("Papel de equipe inválido");
  }

  const prisma = await getPrisma();
  const appointment = await prisma.appointment.findFirst({
    where: { id: input.appointmentId, providerId: input.providerId, tenantId: input.tenantId },
    include: { patient: { select: { name: true, companyId: true } } },
  });
  if (!appointment) throw new Error("Agendamento não encontrado");

  const member = await prisma.user.findFirst({
    where: { id: input.userId, tenantId: input.tenantId, role: { in: ["PRESTADOR", "INTERNO"] } },
  });
  if (!member) throw new Error("Profissional não encontrado");

  const existing = await prisma.appointmentParticipant.findFirst({
    where: {
      appointmentId: input.appointmentId,
      userId: input.userId,
      role: input.role,
    },
  });
  if (existing) throw new Error("Este profissional já está na equipe com este papel");

  let procedureUsageId: string | null = null;

  if (input.chargeFee) {
    if (!canRegisterProcedureForStatus(appointment.status)) {
      throw new Error("Não é possível registrar cobrança neste status de agendamento");
    }

    const feeCode = TEAM_ROLE_FEE_PROCEDURE_CODES[input.role];
    if (!feeCode) throw new Error("Este papel não possui taxa configurada no catálogo");

    const feeProcedure = await prisma.procedure.findFirst({
      where: { tenantId: input.tenantId, code: feeCode },
    });
    if (!feeProcedure) {
      throw new Error(`Procedimento de taxa ${feeCode} não encontrado no catálogo`);
    }

    const { price } = await computePrice(
      feeProcedure.id,
      appointment.patient.companyId,
      input.tenantId,
    );

    const usage = await prisma.procedureUsage.create({
      data: {
        appointmentId: appointment.id,
        procedureId: feeProcedure.id,
        priceCharged: price,
      },
    });
    procedureUsageId = usage.id;

    await recordTimelineEvent({
      tenantId: input.tenantId,
      entityType: TIMELINE_ENTITY_TYPES.PROCEDURE_USAGE,
      entityId: usage.id,
      action: TIMELINE_ACTIONS.PROCEDURE_REGISTERED,
      description: `${feeProcedure.name} (${teamRoleLabel(input.role, input.niche ?? "MEDICAL")}: ${member.name}) — ${formatBRL(price)}`,
      createdBy: input.providerId,
    });
  }

  const row = await prisma.appointmentParticipant.create({
    data: {
      appointmentId: appointment.id,
      userId: member.id,
      role: input.role,
      notes: input.notes?.trim() || null,
      procedureUsageId,
    },
    include: {
      user: { select: { id: true, name: true, specialty: true } },
      procedureUsage: { select: { id: true, priceCharged: true } },
    },
  });

  await recordTimelineEvent({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.APPOINTMENT,
    entityId: appointment.id,
    action: TIMELINE_ACTIONS.UPDATED,
    description: `${teamRoleLabel(input.role, input.niche ?? "MEDICAL")} ${member.name} adicionado à equipe — ${input.patientName}`,
    createdBy: input.providerId,
  });

  return mapParticipant(row, input.niche ?? "MEDICAL");
}

export async function removeAppointmentParticipant(input: {
  participantId: string;
  appointmentId: string;
  tenantId: string;
  providerId: string;
}): Promise<boolean> {
  const prisma = await getPrisma();

  const participant = await prisma.appointmentParticipant.findFirst({
    where: {
      id: input.participantId,
      appointmentId: input.appointmentId,
      appointment: { providerId: input.providerId, tenantId: input.tenantId },
    },
    include: { procedureUsage: { select: { id: true, billed: true } } },
  });
  if (!participant) return false;

  if (participant.procedureUsage && !participant.procedureUsage.billed) {
    await prisma.procedureUsage.delete({ where: { id: participant.procedureUsage.id } });
  }

  await prisma.appointmentParticipant.delete({ where: { id: participant.id } });
  return true;
}

export type ProcedureTeamHint = {
  procedureId: string;
  procedureName: string;
  requirements: ReturnType<typeof parseTeamRoleRequirements>;
};

export async function getProcedureTeamRequirements(
  procedureId: string,
  tenantId: string,
): Promise<ProcedureTeamHint | null> {
  const prisma = await getPrisma();
  const procedure = await prisma.procedure.findFirst({
    where: { id: procedureId, tenantId },
    select: { id: true, name: true, requiredTeamRoles: true },
  });
  if (!procedure) return null;
  return {
    procedureId: procedure.id,
    procedureName: procedure.name,
    requirements: parseTeamRoleRequirements(procedure.requiredTeamRoles),
  };
}

export function validateTeamRequirements(
  requirements: ReturnType<typeof parseTeamRoleRequirements>,
  participants: { role: string }[],
): string | null {
  for (const req of requirements) {
    if (!req.required) continue;
    const count = participants.filter((p) => p.role === req.role).length;
    const min = req.minCount ?? 1;
    if (count < min) {
      return `Falta ${teamRoleLabel(req.role)} (${count}/${min})`;
    }
  }
  return null;
}
