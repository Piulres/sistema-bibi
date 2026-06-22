import "server-only";
import { getPrisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { ROLES } from "@/lib/roles";
import { isInternoProfile } from "@/lib/interno-permissions";
import { recordTimelineEvent, TIMELINE_ACTIONS, TIMELINE_ENTITY_TYPES } from "@/lib/timeline";

export { COUNCIL_TYPES } from "@/lib/cadastro-constants";

export const ASSIGNABLE_ROLES = [
  ROLES.PRESTADOR,
  ROLES.INTERNO,
  ROLES.PJ,
  ROLES.BENEFICIARIO,
] as const;

export function isAssignableRole(value: string): boolean {
  return (ASSIGNABLE_ROLES as readonly string[]).includes(value);
}

export type UserProfessionalFields = {
  phone?: string | null;
  councilType?: string | null;
  councilNumber?: string | null;
  councilUf?: string | null;
  specialty?: string | null;
};

export type UserListView = {
  id: string;
  email: string;
  name: string;
  role: string;
  internoProfile: string | null;
  companyId: string | null;
  patientId: string | null;
  phone: string | null;
  councilType: string | null;
  councilNumber: string | null;
  councilUf: string | null;
  specialty: string | null;
};

function trimOrNull(value: string | null | undefined): string | null {
  const v = value?.trim();
  return v || null;
}

function mapUser(u: {
  id: string;
  email: string;
  name: string;
  role: string;
  internoProfile: string | null;
  companyId: string | null;
  patientId: string | null;
  phone: string | null;
  councilType: string | null;
  councilNumber: string | null;
  councilUf: string | null;
  specialty: string | null;
}): UserListView {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    internoProfile: u.internoProfile,
    companyId: u.companyId,
    patientId: u.patientId,
    phone: u.phone,
    councilType: u.councilType,
    councilNumber: u.councilNumber,
    councilUf: u.councilUf,
    specialty: u.specialty,
  };
}

function professionalData(fields: UserProfessionalFields) {
  return {
    phone: fields.phone === undefined ? undefined : trimOrNull(fields.phone),
    councilType: fields.councilType === undefined ? undefined : trimOrNull(fields.councilType),
    councilNumber: fields.councilNumber === undefined ? undefined : trimOrNull(fields.councilNumber),
    councilUf: fields.councilUf === undefined ? undefined : trimOrNull(fields.councilUf)?.toUpperCase(),
    specialty: fields.specialty === undefined ? undefined : trimOrNull(fields.specialty),
  };
}

function validateRoleLinks(role: string, companyId?: string | null, patientId?: string | null) {
  if (role === ROLES.PJ && !companyId) {
    return { error: "Usuário PJ precisa de empresa vinculada" as const };
  }
  if (role === ROLES.BENEFICIARIO && !patientId) {
    return { error: "Usuário beneficiário precisa de paciente vinculado" as const };
  }
  return null;
}

export async function listUsers(tenantId: string): Promise<UserListView[]> {
  const prisma = await getPrisma();
  const rows = await prisma.user.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
  });
  return rows.map(mapUser);
}

export async function createUser(
  input: {
    tenantId: string;
    email: string;
    password: string;
    name: string;
    role: string;
    companyId?: string | null;
    patientId?: string | null;
    internoProfile?: string | null;
    createdBy: string;
  } & UserProfessionalFields,
) {
  const prisma = await getPrisma();

  if (!isAssignableRole(input.role)) {
    return { error: "Perfil inválido" as const };
  }

  if (input.role === ROLES.INTERNO && input.internoProfile && !isInternoProfile(input.internoProfile)) {
    return { error: "Perfil interno inválido" as const };
  }

  const linkError = validateRoleLinks(input.role, input.companyId, input.patientId);
  if (linkError) return linkError;

  const email = input.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "E-mail já cadastrado" as const };

  const user = await prisma.user.create({
    data: {
      tenantId: input.tenantId,
      email,
      password: hashPassword(input.password),
      name: input.name.trim(),
      role: input.role,
      internoProfile: input.role === ROLES.INTERNO ? (input.internoProfile ?? null) : null,
      companyId: input.role === ROLES.PJ ? (input.companyId ?? null) : null,
      patientId: input.role === ROLES.BENEFICIARIO ? (input.patientId ?? null) : null,
      ...professionalData(input),
    },
  });

  await recordTimelineEvent({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.USER,
    entityId: user.id,
    action: TIMELINE_ACTIONS.CREATED,
    description: `Usuário ${user.name} (${user.role}) criado`,
    createdBy: input.createdBy,
  });

  return { user: mapUser(user) };
}

export async function updateUser(
  input: {
    tenantId: string;
    userId: string;
    email?: string;
    password?: string;
    name?: string;
    role?: string;
    companyId?: string | null;
    patientId?: string | null;
    internoProfile?: string | null;
    createdBy: string;
  } & UserProfessionalFields,
) {
  const prisma = await getPrisma();

  const existing = await prisma.user.findFirst({
    where: { id: input.userId, tenantId: input.tenantId },
  });
  if (!existing) return null;

  if (input.role && !isAssignableRole(input.role)) {
    return { error: "Perfil inválido" as const };
  }

  const nextRole = input.role ?? existing.role;
  if (nextRole === ROLES.INTERNO && input.internoProfile && !isInternoProfile(input.internoProfile)) {
    return { error: "Perfil interno inválido" as const };
  }

  const nextCompanyId =
    input.companyId !== undefined ? input.companyId : existing.companyId;
  const nextPatientId =
    input.patientId !== undefined ? input.patientId : existing.patientId;

  const linkError = validateRoleLinks(nextRole, nextCompanyId, nextPatientId);
  if (linkError) return linkError;

  if (input.email) {
    const email = input.email.toLowerCase().trim();
    const dup = await prisma.user.findFirst({
      where: { email, NOT: { id: existing.id } },
    });
    if (dup) return { error: "E-mail já cadastrado" as const };
  }

  const user = await prisma.user.update({
    where: { id: existing.id },
    data: {
      email: input.email?.toLowerCase().trim(),
      password: input.password ? hashPassword(input.password) : undefined,
      name: input.name?.trim(),
      role: input.role,
      internoProfile:
        nextRole === ROLES.INTERNO
          ? input.internoProfile === undefined
            ? undefined
            : input.internoProfile
          : null,
      companyId: nextRole === ROLES.PJ ? nextCompanyId : null,
      patientId: nextRole === ROLES.BENEFICIARIO ? nextPatientId : null,
      ...professionalData(input),
    },
  });

  await recordTimelineEvent({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.USER,
    entityId: user.id,
    action: TIMELINE_ACTIONS.UPDATED,
    description: `Usuário ${user.name} atualizado`,
    createdBy: input.createdBy,
  });

  return { user: mapUser(user) };
}
