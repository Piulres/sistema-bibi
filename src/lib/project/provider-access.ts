import type { Prisma } from "@prisma/client";

/** Filtro Prisma: prestador alocado na obra (gerente, tarefa ou alocação ativa). */
export function providerProjectAccessFilter(
  tenantId: string,
  providerId: string,
): Prisma.ProjectWhereInput {
  return {
    tenantId,
    OR: [
      { managerId: providerId },
      { tasks: { some: { assigneeId: providerId } } },
      { allocations: { some: { providerId, status: "ATIVO" } } },
    ],
  };
}
