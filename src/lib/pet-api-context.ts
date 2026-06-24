import "server-only";
import { getPrisma } from "@/lib/db";

export async function getPrestadorPetContext(tenantId: string, petId: string) {
  const prisma = await getPrisma();
  return prisma.pet.findFirst({
    where: { id: petId, tenantId },
    include: {
      patient: { select: { id: true, name: true } },
    },
  });
}
