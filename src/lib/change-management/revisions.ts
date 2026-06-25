import "server-only";
import type { Prisma } from "@prisma/client";

type DbClient = Prisma.TransactionClient | { entityRevision: Prisma.TransactionClient["entityRevision"] };

export async function getNextRevision(
  client: DbClient,
  entityType: string,
  entityId: string,
): Promise<number> {
  const latest = await client.entityRevision.findFirst({
    where: { entityType, entityId },
    orderBy: { revision: "desc" },
    select: { revision: true },
  });
  return (latest?.revision ?? 0) + 1;
}

export async function createEntityRevision(
  client: DbClient,
  input: {
    tenantId: string;
    entityType: string;
    entityId: string;
    snapshot: Record<string, unknown>;
    timelineId?: string | null;
    createdBy?: string | null;
  },
) {
  const revision = await getNextRevision(client, input.entityType, input.entityId);
  return client.entityRevision.create({
    data: {
      tenantId: input.tenantId,
      entityType: input.entityType,
      entityId: input.entityId,
      revision,
      snapshot: JSON.stringify(input.snapshot),
      timelineId: input.timelineId ?? null,
      createdBy: input.createdBy ?? null,
    },
  });
}

export type EntityRevisionView = {
  id: string;
  revision: number;
  snapshot: Record<string, unknown>;
  timelineId: string | null;
  createdAt: string;
  createdBy: string | null;
};

export async function listEntityRevisions(
  tenantId: string,
  entityType: string,
  entityId: string,
  client: DbClient & { entityRevision: Prisma.TransactionClient["entityRevision"] },
): Promise<EntityRevisionView[]> {
  const rows = await client.entityRevision.findMany({
    where: { tenantId, entityType, entityId },
    orderBy: { revision: "desc" },
    take: 50,
  });
  return rows.map((row) => ({
    id: row.id,
    revision: row.revision,
    snapshot: JSON.parse(row.snapshot) as Record<string, unknown>,
    timelineId: row.timelineId,
    createdAt: row.createdAt.toISOString(),
    createdBy: row.createdBy,
  }));
}
