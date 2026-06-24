import "server-only";
import { randomUUID } from "node:crypto";
import { getPrisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { buildChangeMetadata, buildDeleteMetadata } from "@/lib/change-management/metadata";
import { createEntityRevision } from "@/lib/change-management/revisions";
import { recordTimelineEvent } from "@/lib/timeline";

export type RunChangeInput<T> = {
  tenantId: string;
  entityType: string;
  entityId: string;
  action: string;
  description: string;
  createdBy: string;
  reversible?: boolean;
  correlationId?: string;
  reversesId?: string;
  before?: Record<string, unknown>;
  afterSnapshot?: (result: T) => Record<string, unknown>;
  deleteSnapshot?: Record<string, unknown>;
  execute: (tx: Prisma.TransactionClient) => Promise<T>;
};

export function newCorrelationId(): string {
  return randomUUID();
}

export async function runChangeCommand<T>(input: RunChangeInput<T>): Promise<T> {
  const prisma = await getPrisma();
  return prisma.$transaction(async (tx) => {
    const result = await input.execute(tx);
    const after = input.afterSnapshot?.(result);
    let metadata;
    if (input.deleteSnapshot) {
      metadata = buildDeleteMetadata(input.deleteSnapshot);
    } else if (input.before && after) {
      metadata = buildChangeMetadata(input.before, after);
    }

    const event = await recordTimelineEvent(
      {
        tenantId: input.tenantId,
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
        description: input.description,
        createdBy: input.createdBy,
        metadata,
        correlationId: input.correlationId,
        reversesId: input.reversesId,
        reversible: input.reversible ?? Boolean(metadata?.before),
      },
      tx,
    );

    if (event && after && metadata?.fieldsChanged?.length) {
      await createEntityRevision(tx, {
        tenantId: input.tenantId,
        entityType: input.entityType,
        entityId: input.entityId,
        snapshot: after,
        timelineId: event.id,
        createdBy: input.createdBy,
      });
    }

    return result;
  });
}
