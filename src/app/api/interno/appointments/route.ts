import { NextResponse } from "next/server";
import { requireInternoModule, requireInternoModuleWrite, authErrorResponse } from "@/lib/api-auth";
import {
  createAppointment,
  isAppointmentStatus,
  listAppointments,
  listProviders,
} from "@/lib/appointment-service";
import { isAppointmentModality } from "@/lib/telemedicine";
import { listPatients } from "@/lib/patient-service";
import { listProcedures } from "@/lib/procedure-service";
import { listPets } from "@/lib/pet-service";
import { getPrisma } from "@/lib/db";
import { getDataStoreMode, isDualDataStoreEnabled } from "@/lib/data-store-mode";
import { requiresPet } from "@/lib/vet-niche";
import { dayRangeInAppTz } from "@/lib/timezone";

export async function GET(request: Request) {
  try {
    const user = await requireInternoModule("agenda");
    const url = new URL(request.url);
    const dateParam = url.searchParams.get("date");
    const providerId = url.searchParams.get("providerId") ?? undefined;

    let from: Date | undefined;
    let to: Date | undefined;
    if (dateParam) {
      const range = dayRangeInAppTz(dateParam);
      from = range.from;
      to = range.to;
    }

    const prisma = await getPrisma();
    const tenant = await prisma.tenant.findFirst({
      where: { id: user.tenantId },
      select: { niche: true },
    });

    const [appointments, providers, patients, procedures, pets, dataStoreMode] =
      await Promise.all([
        listAppointments({ tenantId: user.tenantId, from, to, providerId }),
        listProviders(user.tenantId),
        listPatients(user.tenantId),
        listProcedures(user.tenantId),
        requiresPet(tenant?.niche) ? listPets(user.tenantId) : Promise.resolve([]),
        isDualDataStoreEnabled() ? getDataStoreMode() : Promise.resolve("demo" as const),
      ]);

    return NextResponse.json({
      appointments,
      providers,
      patients,
      procedures,
      pets,
      niche: tenant?.niche,
      dataStoreMode,
      /** Em demo na Netlify, escritas no /tmp somem entre Lambdas — walk-in parece falhar. */
      walkInEphemeral: isDualDataStoreEnabled() && dataStoreMode === "demo",
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireInternoModuleWrite("agenda");
    const body = (await request.json()) as {
      patientId?: string;
      petId?: string | null;
      providerId?: string;
      procedureId?: string;
      scheduledAt?: string;
      reason?: string | null;
      status?: string;
      modality?: string;
      autoAssignProvider?: boolean;
    };

    if (!body.patientId || !body.scheduledAt) {
      return NextResponse.json(
        { error: "Informe paciente e data/hora" },
        { status: 400 },
      );
    }
    if (!body.providerId && !body.autoAssignProvider) {
      return NextResponse.json(
        { error: "Informe o prestador ou marque atribuição automática" },
        { status: 400 },
      );
    }
    if (body.status && !isAppointmentStatus(body.status)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }
    if (body.modality && !isAppointmentModality(body.modality)) {
      return NextResponse.json({ error: "Modalidade inválida" }, { status: 400 });
    }

    const result = await createAppointment({
      tenantId: user.tenantId,
      patientId: body.patientId,
      petId: body.petId,
      providerId: body.providerId,
      procedureId: body.procedureId,
      scheduledAt: new Date(body.scheduledAt),
      reason: body.reason,
      status: body.status,
      modality: body.modality,
      autoAssignProvider: body.autoAssignProvider,
      createdBy: user.id,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return authErrorResponse(error);
  }
}
