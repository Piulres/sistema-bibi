import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { getVoaConfig } from "@/lib/voa/config";
import { buildConsentWarning, buildVoaMountParams } from "@/lib/voa/mount";

/** Configuração de sessão Voa para o atendimento (plugin mount). */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/prestador/appointments/[id]/voa">,
) {
  const prisma = await getPrisma();
  try {
    const user = await requireUser(["PRESTADOR"]);
    const { id } = await ctx.params;
    const config = getVoaConfig();

    const appointment = await prisma.appointment.findFirst({
      where: { id, providerId: user.id, tenantId: user.tenantId },
      include: { patient: { select: { id: true, consentAt: true } } },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
    }

    const mount = buildVoaMountParams({
      appointmentId: appointment.id,
      patientId: appointment.patient.id,
      providerId: user.id,
      modality: appointment.modality,
      patientConsentAt: appointment.patient.consentAt,
    });

    return NextResponse.json({
      enabled: config.enabled,
      configured: config.hasToken,
      pluginScriptUrl: config.pluginScriptUrl,
      token: config.enabled && config.integrationToken ? config.integrationToken : null,
      consentWarning: buildConsentWarning(appointment.patient.consentAt),
      mount,
    } satisfies {
      enabled: boolean;
      configured: boolean;
      pluginScriptUrl: string;
      token: string | null;
      consentWarning: string | null;
      mount: ReturnType<typeof buildVoaMountParams>;
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
