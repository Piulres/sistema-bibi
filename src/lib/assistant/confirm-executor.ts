import "server-only";
import { createUser } from "@/lib/user-service";
import { createPatient } from "@/lib/patient-service";
import { createAppointment } from "@/lib/appointment-service";
import { bookBeneficiaryAppointment } from "@/lib/scheduling-service";
import type { PendingActionPayload } from "@/lib/assistant/types";
import type { SessionUser } from "@/lib/session";

export type ConfirmResult =
  | { ok: true; message: string; href?: string; entityId?: string }
  | { ok: false; error: string };

export async function executePendingAction(
  user: SessionUser,
  payload: PendingActionPayload,
  passwordOverride?: string,
): Promise<ConfirmResult> {
  switch (payload.type) {
    case "create_user": {
      const password = passwordOverride?.trim() || payload.data.password;
      if (!password) return { ok: false, error: "Senha obrigatória para confirmar." };

      const result = await createUser({
        tenantId: user.tenantId,
        email: payload.data.email,
        password,
        name: payload.data.name,
        role: payload.data.role,
        internoProfile: payload.data.internoProfile,
        companyId: payload.data.companyId,
        patientId: payload.data.patientId,
        createdBy: user.id,
      });

      if ("error" in result) return { ok: false, error: result.error };
      return {
        ok: true,
        message: `Usuário **${result.user.name}** criado (${result.user.email}).`,
        href: "/interno/cadastros",
        entityId: result.user.id,
      };
    }

    case "create_patient": {
      const result = await createPatient({
        tenantId: user.tenantId,
        name: payload.data.name,
        cpf: payload.data.cpf,
        birthDate: new Date(payload.data.birthDate),
        phone: payload.data.phone,
        email: payload.data.email,
        companyId: payload.data.companyId,
        createdBy: user.id,
      });

      if ("error" in result) return { ok: false, error: result.error };
      return {
        ok: true,
        message: `${user.labels.patient} **${result.patient.name}** cadastrado(a).`,
        href: `/interno/beneficiarios/${result.patient.id}`,
        entityId: result.patient.id,
      };
    }

    case "create_appointment": {
      const result = await createAppointment({
        tenantId: user.tenantId,
        patientId: payload.data.patientId,
        providerId: payload.data.providerId,
        procedureId: payload.data.procedureId,
        scheduledAt: new Date(payload.data.scheduledAt),
        reason: payload.data.reason,
        autoAssignProvider: payload.data.autoAssignProvider,
        createdBy: user.id,
      });

      if ("error" in result) return { ok: false, error: result.error };
      const appt = result.appointment;
      return {
        ok: true,
        message: `${user.labels.appointment} agendado(a) para **${appt.scheduledAtLabel}**.`,
        href: "/interno/agenda",
        entityId: appt.id,
      };
    }

    case "book_appointment": {
      if (!user.patientId) return { ok: false, error: "Conta sem beneficiário vinculado." };
      if (payload.data.patientId !== user.patientId) {
        return { ok: false, error: "Só é possível agendar para sua própria conta." };
      }

      const result = await bookBeneficiaryAppointment({
        tenantId: user.tenantId,
        patientId: user.patientId,
        providerId: payload.data.providerId,
        procedureId: payload.data.procedureId,
        scheduledAt: new Date(payload.data.scheduledAt),
        reason: payload.data.reason,
        autoAssignProvider: payload.data.autoAssignProvider,
        createdBy: user.id,
      });

      if ("error" in result) return { ok: false, error: result.error };
      const appt = result.appointment;
      return {
        ok: true,
        message: `${user.labels.appointment} confirmado(a) para **${appt.scheduledAtLabel}**.`,
        href: "/beneficiario/agenda",
        entityId: appt.id,
      };
    }

    default:
      return { ok: false, error: "Ação desconhecida." };
  }
}
