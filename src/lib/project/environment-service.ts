import "server-only";
import { getPrisma } from "@/lib/db";
import { calculateAreas, labelOf, ENVIRONMENT_TYPES } from "@/lib/project/construction-modules";

export type EnvironmentView = {
  id: string;
  name: string;
  environmentType: string;
  environmentTypeLabel: string;
  length: number | null;
  width: number | null;
  height: number | null;
  floorArea: number | null;
  wallArea: number | null;
  ceilingArea: number | null;
  notes: string | null;
  sortOrder: number;
};

export async function listProjectEnvironments(
  tenantId: string,
  projectId: string,
): Promise<EnvironmentView[]> {
  const prisma = await getPrisma();
  const rows = await prisma.projectEnvironment.findMany({
    where: { tenantId, projectId },
    orderBy: { sortOrder: "asc" },
  });
  return rows.map(mapEnvironment);
}

export async function upsertProjectEnvironment(
  tenantId: string,
  projectId: string,
  input: {
    id?: string;
    name: string;
    environmentType: string;
    length?: number | null;
    width?: number | null;
    height?: number | null;
    notes?: string | null;
    sortOrder?: number;
  },
): Promise<{ data: EnvironmentView } | { error: string }> {
  const prisma = await getPrisma();
  const project = await prisma.project.findFirst({ where: { id: projectId, tenantId } });
  if (!project) return { error: "Obra não encontrada" };

  let floorArea: number | null = null;
  let wallArea: number | null = null;
  let ceilingArea: number | null = null;

  const length = input.length ?? null;
  const width = input.width ?? null;
  const height = input.height ?? null;

  if (length && width && height) {
    const areas = calculateAreas(length, width, height);
    floorArea = areas.floorArea;
    wallArea = areas.wallArea;
    ceilingArea = areas.ceilingArea;
  }

  const payload = {
    name: input.name,
    environmentType: input.environmentType,
    length,
    width,
    height,
    floorArea,
    wallArea,
    ceilingArea,
    notes: input.notes ?? null,
    sortOrder: input.sortOrder ?? 0,
  };

  const row = input.id
    ? await prisma.projectEnvironment.update({ where: { id: input.id }, data: payload })
    : await prisma.projectEnvironment.create({
        data: { ...payload, tenantId, projectId },
      });

  return { data: mapEnvironment(row) };
}

export async function deleteProjectEnvironment(
  tenantId: string,
  environmentId: string,
): Promise<{ ok: true } | { error: string }> {
  const prisma = await getPrisma();
  const row = await prisma.projectEnvironment.findFirst({ where: { id: environmentId, tenantId } });
  if (!row) return { error: "Ambiente não encontrado" };
  await prisma.projectEnvironment.delete({ where: { id: environmentId } });
  return { ok: true };
}

function mapEnvironment(row: {
  id: string;
  name: string;
  environmentType: string;
  length: number | null;
  width: number | null;
  height: number | null;
  floorArea: number | null;
  wallArea: number | null;
  ceilingArea: number | null;
  notes: string | null;
  sortOrder: number;
}): EnvironmentView {
  return {
    id: row.id,
    name: row.name,
    environmentType: row.environmentType,
    environmentTypeLabel: labelOf(ENVIRONMENT_TYPES, row.environmentType),
    length: row.length,
    width: row.width,
    height: row.height,
    floorArea: row.floorArea,
    wallArea: row.wallArea,
    ceilingArea: row.ceilingArea,
    notes: row.notes,
    sortOrder: row.sortOrder,
  };
}
