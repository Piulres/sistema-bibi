"use client";

import { useCallback, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ViewStateBoundary from "@/components/ui/ViewStateBoundary";
import SectionHeader from "@/components/ui/SectionHeader";
import EmptyState from "@/components/ui/EmptyState";
import CalloutCard from "@/components/ui/CalloutCard";
import AppointmentCard from "@/components/ui/AppointmentCard";
import FlowStepper from "@/components/ui/FlowStepper";
import { CARE_JOURNEY_STEPS } from "@/lib/care-journey";
import { useLabels } from "@/hooks/useLabels";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { fetchJson } from "@/lib/ui/api-feedback";
import { confirmPresets } from "@/lib/ui/confirm-presets";

type Appointment = {
  id: string;
  scheduledAtLabel: string;
  status: string;
  modality: string;
  telemedicineUrl: string | null;
  patientName: string;
  petName: string | null;
  providerName: string;
  reason: string | null;
};

type Option = { id: string; name: string };
type ProcedureOption = { id: string; name: string; code: string };

type PetOption = {
  id: string;
  name: string;
  patientId: string;
  speciesLabel: string;
  tutorName: string;
};

type AppointmentsPayload = {
  appointments?: Appointment[];
  providers?: Option[];
  patients?: Option[];
  procedures?: ProcedureOption[];
  pets?: PetOption[];
};

const fieldClass =
  "mt-1 w-full rounded-[var(--radius-button)] border border-[var(--border-muted)] bg-[var(--surface-card)] px-3 py-2 text-sm";

function timeFromScheduleLabel(label: string): string {
  const match = label.match(/(\d{2}:\d{2})/);
  return match?.[1] ?? "—";
}

export default function AppointmentsView() {
  const { niche, labels } = useLabels();
  const isVet = niche === "VET";
  const { isBusy, run, showToast } = useAsyncAction();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const loadAppointments = useCallback(
    () =>
      fetchJson<AppointmentsPayload>(
        `/api/interno/appointments?date=${date}`,
        undefined,
        "Erro ao carregar agenda",
      ),
    [date],
  );

  const { data, loading, error, reload } = useAsyncData(loadAppointments, [date]);

  const appointments = data?.appointments ?? [];
  const providers = data?.providers ?? [];
  const patients = data?.patients ?? [];
  const procedures = data?.procedures ?? [];
  const pets = data?.pets ?? [];

  const [form, setForm] = useState({
    patientId: "",
    petId: "",
    providerId: "",
    procedureId: "",
    autoAssignProvider: false,
    time: "09:00",
    reason: "Consulta",
    status: "CONFIRMADO",
    modality: "PRESENCIAL",
  });

  const [walkIn, setWalkIn] = useState({
    name: "",
    cpf: "",
    birthDate: "",
    phone: "",
    providerId: "",
    procedureId: "",
    autoAssignProvider: false,
    time: "",
    reason: "Consulta walk-in",
    createPortalUser: false,
    petName: "",
    petSpecies: "CANINO",
  });

  async function createAppointment(e: React.FormEvent) {
    e.preventDefault();
    const scheduledAt = new Date(`${date}T${form.time}:00`).toISOString();
    await run(
      "create",
      () =>
        fetch("/api/interno/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientId: form.patientId,
            petId: isVet ? form.petId : null,
            providerId: form.autoAssignProvider ? undefined : form.providerId,
            procedureId: form.procedureId || undefined,
            autoAssignProvider: form.autoAssignProvider,
            scheduledAt,
            reason: form.reason,
            status: form.status,
            modality: form.modality,
          }),
        }),
      {
        successMessage: "Consulta agendada com sucesso",
        onSuccess: async (body) => {
          const appt = body.appointment as { patientName?: string } | undefined;
          if (appt?.patientName) {
            showToast({
              message: `Agendado para ${appt.patientName}`,
              tone: "info",
            });
          }
          await reload();
        },
      },
    );
  }

  async function walkInAndSchedule(e: React.FormEvent) {
    e.preventDefault();

    if (isVet && !walkIn.petName.trim()) {
      showToast({
        message: `Informe o nome do ${labels.patient.toLowerCase()} para agendar no segmento veterinário`,
        tone: "danger",
      });
      return;
    }

    const time =
      walkIn.time ||
      `${String(new Date().getHours()).padStart(2, "0")}:${String(new Date().getMinutes()).padStart(2, "0")}`;
    const scheduledAt = new Date(`${date}T${time}:00`).toISOString();

    await run(
      "walkin",
      () =>
        fetch("/api/interno/appointments/walk-in", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: walkIn.name,
            cpf: walkIn.cpf,
            birthDate: walkIn.birthDate,
            phone: walkIn.phone || null,
            providerId: walkIn.autoAssignProvider ? undefined : walkIn.providerId,
            procedureId: walkIn.procedureId || undefined,
            autoAssignProvider: walkIn.autoAssignProvider,
            scheduledAt,
            reason: walkIn.reason,
            ...(isVet
              ? { petName: walkIn.petName.trim(), petSpecies: walkIn.petSpecies }
              : {}),
          }),
        }),
      {
        successMessage: "Walk-in cadastrado e agendado — confirme a chegada na lista abaixo",
        onSuccess: async (body) => {
          const patient = body.patient as { id: string; name: string } | undefined;
          if (walkIn.createPortalUser && patient) {
            const emailBase = walkIn.name
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .replace(/[^a-z0-9]+/g, ".")
              .replace(/^\.|\.$/g, "");
            await fetch("/api/interno/users", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: walkIn.name,
                email: `${emailBase || "paciente"}.${Date.now()}@walkin.demo`,
                password: "bibi123",
                role: "BENEFICIARIO",
                patientId: patient.id,
              }),
            });
          }
          setWalkIn({
            name: "",
            cpf: "",
            birthDate: "",
            phone: "",
            providerId: "",
            procedureId: "",
            autoAssignProvider: false,
            time: "",
            reason: "Consulta walk-in",
            createPortalUser: false,
            petName: "",
            petSpecies: "CANINO",
          });
          await reload();
        },
      },
    );
  }

  async function updateStatus(id: string, status: string, whenLabel: string) {
    await run(
      id,
      () =>
        fetch(`/api/interno/appointments/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }),
      {
        confirm:
          status === "CANCELADO"
            ? confirmPresets.cancelAppointment(whenLabel)
            : undefined,
        silentSuccess: status !== "CONFIRMADO" && status !== "CANCELADO",
        successMessage:
          status === "CONFIRMADO"
            ? "Chegada confirmada — paciente aguardando atendimento."
            : status === "CANCELADO"
              ? "Agendamento cancelado."
              : undefined,
        onSuccess: async () => {
          await reload();
        },
      },
    );
  }

  async function confirmArrival(id: string, whenLabel: string) {
    await updateStatus(id, "CONFIRMADO", whenLabel);
  }

  return (
    <ViewStateBoundary
      loading={loading}
      error={error}
      loadingMessage="Carregando agenda..."
      onRetry={() => void reload()}
    >
      <div className="space-y-8">
        <CalloutCard
          id="walk-in"
          data-tour-id="walk-in-callout"
          variant="walk-in"
          title="Paciente particular (walk-in)"
          description="Chegou na clínica sem cadastro prévio e sem empresa PJ — cadastre e agende em um passo."
          badge="Recepção"
        >
          <FlowStepper
            steps={[...CARE_JOURNEY_STEPS]}
            currentStepId="agendado"
            className="mb-4"
          />
          <form onSubmit={walkInAndSchedule} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block text-sm" htmlFor="walkin-name">
              <span className="text-[var(--text-secondary)]">Nome completo</span>
              <input
                id="walkin-name"
                required
                className={fieldClass}
                value={walkIn.name}
                onChange={(e) => setWalkIn({ ...walkIn, name: e.target.value })}
              />
            </label>
            <label className="block text-sm" htmlFor="walkin-cpf">
              <span className="text-[var(--text-secondary)]">CPF</span>
              <input
                id="walkin-cpf"
                required
                className={fieldClass}
                placeholder="000.000.000-00"
                value={walkIn.cpf}
                onChange={(e) => setWalkIn({ ...walkIn, cpf: e.target.value })}
              />
            </label>
            <label className="block text-sm" htmlFor="walkin-birth">
              <span className="text-[var(--text-secondary)]">Nascimento</span>
              <input
                id="walkin-birth"
                required
                type="date"
                className={fieldClass}
                value={walkIn.birthDate}
                onChange={(e) => setWalkIn({ ...walkIn, birthDate: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="text-[var(--text-secondary)]">Telefone (opcional)</span>
              <input
                className={fieldClass}
                value={walkIn.phone}
                onChange={(e) => setWalkIn({ ...walkIn, phone: e.target.value })}
              />
            </label>
            <label className="block text-sm" htmlFor="walkin-provider">
              <span className="text-[var(--text-secondary)]">Prestador</span>
              <select
                id="walkin-provider"
                required={!walkIn.autoAssignProvider}
                disabled={walkIn.autoAssignProvider}
                className={fieldClass}
                value={walkIn.providerId}
                onChange={(e) => setWalkIn({ ...walkIn, providerId: e.target.value })}
              >
                <option value="">Selecione...</option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm" htmlFor="walkin-procedure">
              <span className="text-[var(--text-secondary)]">Procedimento (opcional)</span>
              <select
                id="walkin-procedure"
                className={fieldClass}
                value={walkIn.procedureId}
                onChange={(e) => setWalkIn({ ...walkIn, procedureId: e.target.value })}
              >
                <option value="">Não especificado</option>
                {procedures.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={walkIn.autoAssignProvider}
                onChange={(e) =>
                  setWalkIn({
                    ...walkIn,
                    autoAssignProvider: e.target.checked,
                    providerId: e.target.checked ? "" : walkIn.providerId,
                  })
                }
              />
              <span className="text-[var(--text-secondary)]">
                Sem preferência de prestador (atribui automaticamente quem estiver livre)
              </span>
            </label>
            <label className="block text-sm" htmlFor="walkin-time">
              <span className="text-[var(--text-secondary)]">Horário (vazio = agora)</span>
              <input
                id="walkin-time"
                type="time"
                className={fieldClass}
                value={walkIn.time}
                onChange={(e) => setWalkIn({ ...walkIn, time: e.target.value })}
              />
            </label>
            {isVet && (
              <>
                <label className="block text-sm" htmlFor="walkin-pet-name">
                  <span className="text-[var(--text-secondary)]">Nome do {labels.patient.toLowerCase()}</span>
                  <input
                    id="walkin-pet-name"
                    required
                    className={fieldClass}
                    value={walkIn.petName}
                    onChange={(e) => setWalkIn({ ...walkIn, petName: e.target.value })}
                  />
                </label>
                <label className="block text-sm" htmlFor="walkin-pet-species">
                  <span className="text-[var(--text-secondary)]">Espécie</span>
                  <select
                    id="walkin-pet-species"
                    required
                    className={fieldClass}
                    value={walkIn.petSpecies}
                    onChange={(e) => setWalkIn({ ...walkIn, petSpecies: e.target.value })}
                  >
                    <option value="CANINO">Canino</option>
                    <option value="FELINO">Felino</option>
                    <option value="AVES">Aves</option>
                    <option value="OUTRO">Outro</option>
                  </select>
                </label>
              </>
            )}
            <label className="block text-sm sm:col-span-2">
              <span className="text-[var(--text-secondary)]">Motivo</span>
              <input
                className={fieldClass}
                value={walkIn.reason}
                onChange={(e) => setWalkIn({ ...walkIn, reason: e.target.value })}
              />
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-3">
              <input
                type="checkbox"
                checked={walkIn.createPortalUser}
                onChange={(e) => setWalkIn({ ...walkIn, createPortalUser: e.target.checked })}
              />
              <span className="text-[var(--text-secondary)]">
                Criar acesso ao portal beneficiário (senha demo: bibi123)
              </span>
            </label>
            <div className="flex items-end sm:col-span-3">
              <Button type="submit" variant="portal" disabled={isBusy("walkin")}>
                {isBusy("walkin") ? "Processando..." : "Cadastrar e agendar agora"}
              </Button>
            </div>
          </form>
        </CalloutCard>

        <Card>
          <SectionHeader title="Novo agendamento" description="Beneficiário já cadastrado (PJ ou particular)." />
          <form onSubmit={createAppointment} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block text-sm">
              <span className="text-[var(--text-secondary)]">Data</span>
              <input
                type="date"
                className="mt-1 w-full rounded border px-3 py-2"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="text-[var(--text-secondary)]">Horário</span>
              <input
                type="time"
                required
                className="mt-1 w-full rounded border px-3 py-2"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="text-[var(--text-secondary)]">{isVet ? labels.beneficiary : "Beneficiário"}</span>
              <select
                required
                className="mt-1 w-full rounded border px-3 py-2"
                value={form.patientId}
                onChange={(e) => setForm({ ...form, patientId: e.target.value, petId: "" })}
              >
                <option value="">Selecione...</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            {isVet && (
              <label className="block text-sm">
                <span className="text-[var(--text-secondary)]">{labels.patient}</span>
                <select
                  required
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={form.petId}
                  onChange={(e) => setForm({ ...form, petId: e.target.value })}
                >
                  <option value="">Selecione...</option>
                  {pets
                    .filter((p) => !form.patientId || p.patientId === form.patientId)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.speciesLabel}) — {p.tutorName}
                      </option>
                    ))}
                </select>
              </label>
            )}
            <label className="block text-sm">
              <span className="text-[var(--text-secondary)]">Prestador</span>
              <select
                required={!form.autoAssignProvider}
                disabled={form.autoAssignProvider}
                className="mt-1 w-full rounded border px-3 py-2"
                value={form.providerId}
                onChange={(e) => setForm({ ...form, providerId: e.target.value })}
              >
                <option value="">Selecione...</option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-[var(--text-secondary)]">Procedimento (opcional)</span>
              <select
                className="mt-1 w-full rounded border px-3 py-2"
                value={form.procedureId}
                onChange={(e) => setForm({ ...form, procedureId: e.target.value })}
              >
                <option value="">Não especificado</option>
                {procedures.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-2 lg:col-span-3">
              <input
                type="checkbox"
                checked={form.autoAssignProvider}
                onChange={(e) =>
                  setForm({
                    ...form,
                    autoAssignProvider: e.target.checked,
                    providerId: e.target.checked ? "" : form.providerId,
                  })
                }
              />
              <span className="text-[var(--text-secondary)]">
                Sem preferência de prestador (atribui automaticamente quem estiver livre)
              </span>
            </label>
            <label className="block text-sm">
              <span className="text-[var(--text-secondary)]">Modalidade</span>
              <select
                className="mt-1 w-full rounded border px-3 py-2"
                value={form.modality}
                onChange={(e) => setForm({ ...form, modality: e.target.value })}
              >
                <option value="PRESENCIAL">Presencial</option>
                <option value="TELE">Telemedicina</option>
              </select>
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="text-[var(--text-secondary)]">Motivo</span>
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
              />
            </label>
            <div className="flex items-end">
              <Button type="submit" variant="portal" disabled={isBusy("create")}>
                {isBusy("create") ? "Salvando..." : "Agendar"}
              </Button>
            </div>
          </form>
        </Card>

        <section>
          <SectionHeader title={`Agenda do dia (${date.split("-").reverse().join("/")})`} />
          {appointments.length === 0 ? (
            <EmptyState
              title="Agenda vazia"
              message="Nenhum agendamento nesta data."
              hint="Use o walk-in acima para pacientes particulares ou agende um beneficiário já cadastrado."
            />
          ) : (
            <div className="mt-4 space-y-3">
              {appointments.map((a) => (
                <AppointmentCard
                  key={a.id}
                  time={timeFromScheduleLabel(a.scheduledAtLabel)}
                  title={isVet && a.petName ? `${a.petName} · ${labels.beneficiary}: ${a.patientName}` : a.patientName}
                  subtitle={`${a.providerName}${a.modality === "TELE" ? " · Telemedicina" : ""}`}
                  status={a.status}
                  meta={
                    <>
                      {a.telemedicineUrl ? (
                        <a
                          href={a.telemedicineUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-[var(--portal-accent)] hover:underline"
                        >
                          Entrar na sala virtual
                        </a>
                      ) : null}
                      {a.reason ? (
                        <p className="text-sm text-[var(--text-secondary)]">{a.reason}</p>
                      ) : null}
                    </>
                  }
                  actions={
                    <>
                      {a.status === "AGENDADO" && (
                        <Button
                          type="button"
                          variant="portal"
                          size="sm"
                          disabled={isBusy(a.id)}
                          onClick={() => confirmArrival(a.id, a.scheduledAtLabel)}
                        >
                          Confirmar chegada
                        </Button>
                      )}
                      <select
                        className="rounded border border-[var(--border-muted)] bg-[var(--surface-card)] px-2 py-1 text-sm"
                        value={a.status}
                        disabled={isBusy(a.id)}
                        onChange={(e) => updateStatus(a.id, e.target.value, a.scheduledAtLabel)}
                      >
                        <option value="AGENDADO">Agendado</option>
                        <option value="CONFIRMADO">Confirmado</option>
                        <option value="REALIZADO">Realizado</option>
                        <option value="FALTOU">Faltou</option>
                        <option value="CANCELADO">Cancelado</option>
                      </select>
                    </>
                  }
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </ViewStateBoundary>
  );
}
