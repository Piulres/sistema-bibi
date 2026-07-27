import { NextResponse } from "next/server";
import { requireBeneficiary, authErrorResponse } from "@/lib/api-auth";
import { listDischargeDocuments } from "@/lib/clinical-discharge-service";
import { getPrisma } from "@/lib/db";
import { requiresPet } from "@/lib/vet-niche";

export async function GET() {
  try {
    const user = await requireBeneficiary();
    const prisma = await getPrisma();
    const tenant = await prisma.tenant.findFirst({
      where: { id: user.tenantId },
      select: { niche: true },
    });

    const isVetNiche = requiresPet(tenant?.niche);
    const documents = await listDischargeDocuments(user.patientId, user.tenantId, {
      tutorOnly: isVetNiche ? true : undefined,
    });

    return NextResponse.json({ documents });
  } catch (error) {
    return authErrorResponse(error);
  }
}
