import "server-only";
import { listPatients, type PatientListView } from "@/lib/patient-service";
import { listProviders } from "@/lib/appointment-service";
import { listProcedures, type ProcedureView } from "@/lib/procedure-service";

export type EntityOption = {
  id: string;
  label: string;
  detail?: string;
};

export type EntityResolveResult =
  | { status: "unique"; id: string; label: string }
  | { status: "ambiguous"; options: EntityOption[] }
  | { status: "none" };

export function normalizeEntitySearch(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function filterPatients(patients: PatientListView[], query: string): EntityOption[] {
  const q = normalizeEntitySearch(query);
  const cpfDigits = query.replace(/\D/g, "");

  return patients
    .filter((patient) => {
      const name = normalizeEntitySearch(patient.name);
      if (q.length >= 2 && name.includes(q)) return true;
      if (cpfDigits.length >= 3 && patient.cpf.replace(/\D/g, "").includes(cpfDigits)) {
        return true;
      }
      return false;
    })
    .slice(0, 8)
    .map((patient) => ({
      id: patient.id,
      label: patient.name,
      detail: [patient.cpf, patient.companyName].filter(Boolean).join(" · ") || undefined,
    }));
}

function filterProviders(
  providers: { id: string; name: string; email?: string }[],
  query: string,
): EntityOption[] {
  const q = normalizeEntitySearch(query).replace(/\./g, "");

  return providers
    .filter((provider) => {
      const name = normalizeEntitySearch(provider.name).replace(/\./g, "");
      return q.length >= 2 && (name.includes(q) || q.includes(name));
    })
    .slice(0, 8)
    .map((provider) => ({
      id: provider.id,
      label: provider.name,
      detail: provider.email ?? undefined,
    }));
}

function filterProcedures(procedures: ProcedureView[], query: string): EntityOption[] {
  const q = normalizeEntitySearch(query);

  return procedures
    .filter((procedure) => {
      const name = normalizeEntitySearch(procedure.name);
      const code = normalizeEntitySearch(procedure.code);
      return (
        (q.length >= 2 && (name.includes(q) || code.includes(q))) ||
        q === normalizeEntitySearch(procedure.category)
      );
    })
    .slice(0, 8)
    .map((procedure) => ({
      id: procedure.id,
      label: procedure.name,
      detail: `${procedure.code} · ${procedure.basePriceLabel}`,
    }));
}

export function resolveFromOptions(
  options: EntityOption[],
  query?: string,
): EntityResolveResult {
  if (options.length === 0) return { status: "none" };
  if (options.length === 1) {
    return { status: "unique", id: options[0].id, label: options[0].label };
  }

  const normalizedQuery = query ? normalizeEntitySearch(query) : "";
  const exact = options.filter((option) => normalizeEntitySearch(option.label) === normalizedQuery);
  if (exact.length === 1) {
    return { status: "unique", id: exact[0].id, label: exact[0].label };
  }

  const tight = options.filter((option) => {
    const label = normalizeEntitySearch(option.label);
    return normalizedQuery.length >= 4 && label.includes(normalizedQuery);
  });
  if (tight.length === 1) {
    return { status: "unique", id: tight[0].id, label: tight[0].label };
  }

  return { status: "ambiguous", options };
}

export async function resolvePatientByName(
  tenantId: string,
  patientName?: string,
  patientId?: string,
): Promise<EntityResolveResult> {
  if (patientId) return { status: "unique", id: patientId, label: patientName ?? patientId };
  if (!patientName?.trim()) return { status: "none" };

  const patients = await listPatients(tenantId);
  const options = filterPatients(patients, patientName);
  return resolveFromOptions(options, patientName);
}

export async function resolveProviderByName(
  tenantId: string,
  providerName?: string,
  providerId?: string,
): Promise<EntityResolveResult> {
  if (providerId) return { status: "unique", id: providerId, label: providerName ?? providerId };
  if (!providerName?.trim()) return { status: "none" };

  const providers = await listProviders(tenantId);
  const options = filterProviders(providers, providerName);
  return resolveFromOptions(options, providerName);
}

export async function resolveProcedureByName(
  tenantId: string,
  procedureName?: string,
  procedureId?: string,
): Promise<EntityResolveResult> {
  if (procedureId) {
    return { status: "unique", id: procedureId, label: procedureName ?? procedureId };
  }
  if (!procedureName?.trim()) return { status: "none" };

  const procedures = await listProcedures(tenantId);
  const options = filterProcedures(procedures, procedureName);
  return resolveFromOptions(options, procedureName);
}

export async function listAllProviderOptions(tenantId: string): Promise<EntityOption[]> {
  const { getPrisma } = await import("@/lib/db");
  const prisma = await getPrisma();
  const rows = await prisma.user.findMany({
    where: { tenantId, role: "PRESTADOR" },
    select: { id: true, name: true, email: true, specialty: true },
    orderBy: { name: "asc" },
  });
  return rows.map((row) => ({
    id: row.id,
    label: row.name,
    detail: row.specialty ?? row.email ?? undefined,
  }));
}

export async function listAllProcedureOptions(tenantId: string): Promise<EntityOption[]> {
  const procedures = await listProcedures(tenantId);
  return procedures.map((procedure) => ({
    id: procedure.id,
    label: procedure.name,
    detail: `${procedure.code} · ${procedure.basePriceLabel}`,
  }));
}

export function formatChoiceQuestion(
  fieldLabel: string,
  options: EntityOption[],
): string {
  const lines = [
    `Encontrei **${options.length}** opções de ${fieldLabel}. Qual é a correta?`,
    "",
    ...options.map((option, index) => {
      const detail = option.detail ? ` — ${option.detail}` : "";
      return `**${index + 1}.** ${option.label}${detail}`;
    }),
    "",
    "Responda com o **número** ou o **nome completo** da opção.",
  ];
  return lines.join("\n");
}
