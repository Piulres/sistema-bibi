"use client";

import { useCallback, useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import LoadingState from "@/components/ui/LoadingState";
import SectionHeader from "@/components/ui/SectionHeader";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";

type Appointment = {
  id: string;
  scheduledAtLabel: string;
  status: string;
  modality: string;
  telemedicineUrl: string | null;
  patientName: string;
  providerName: string;
  reason: string | null;
};

type Option = { id: string; name: string };

const fieldClass =
  "mt-1 w-full rounded-[var(--radius-button)] border border-[var(--border-muted)] bg-[var(--surface-card)] px-3 py-2 text-sm";

export default function AppointmentsView() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [providers, setProviders] = useState<Option[]>([]);
  const [patients, setPatients] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    patientId: "",
    providerId: "",
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
    time: "",
    reason: "Consulta walk-in",
    createPortalUser: false,
  });

  const load = useCallback(async () => {
    const res = await fetch(`/api/interno/appointments?date=${date}`);
    const data = await res.json();
    setAppointments(data.appointments ?? []);
    setProviders(data.providers ?? []);
    setPatients(data.patients ?? []);
    setLoading(false);
  }, [date]);

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await fetch(`/api/interno/appointments?date=${date}`);
      const data = await res.json();
      if (!active) return;
      setAppointments(data.appointments ?? []);
      setProviders(data.providers ?? []);
      setPatients(data.patients ?? []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [date]);

  async function createAppointment(e: React.FormEvent) {
    e.preventDefault();
    setBusy("create");
    setMsg(null);
    try {
      const scheduledAt = new Date(`${date}T${form.time}:00`).toISOString();
      const res = await fetch("/api/interno/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: form.patientId,
          providerId: form.providerId,
          scheduledAt,
          reason: form.reason,
          status: form.status,
          modality: form.modality,
        }),
      });
      const data = await res.json();
      if (!res.ok) setMsg(data.error ?? "Erro ao agendar");
      else {
        setMsg(`Consulta agendada para ${data.appointment.patientName}`);
        await load();
      }
    } finally {
      setBusy(null);
    }
  }

  async function walkInAndSchedule(e: React.FormEvent) {
    e.preventDefault();
    setBusy("walkin");
    setMsg(null);
    try {
      const patientRes = await fetch("/api/interno/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: walkIn.name,
          cpf: walkIn.cpf,
          birthDate: walkIn.birthDate,
          phone: walkIn.phone || null,
          companyId: null,
        }),
      });
      const patientData = await patientRes.json();
      if (!patientRes.ok) {
        setMsg(patientData.error ?? "Erro ao cadastrar paciente");
        return;
      }

      const time =
        walkIn.time ||
        `${String(new Date().getHours()).padStart(2, "0")}:${String(new Date().getMinutes()).padStart(2, "0")}`;
      const scheduledAt = new Date(`${date}T${time}:00`).toISOString();

      const apptRes = await fetch("/api/interno/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patientData.patient.id,
          providerId: walkIn.providerId,
          scheduledAt,
          reason: walkIn.reason,
          status: "AGENDADO",
          modality: "PRESENCIAL",
        }),
      });
      const apptData = await apptRes.json();
      if (!apptRes.ok) {
        setMsg(apptData.error ?? "Paciente cadastrado, mas falha ao agendar");
        await load();
        return;
      }

      if (walkIn.createPortalUser) {
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
            patientId: patientData.patient.id,
          }),
        });
      }

      setMsg(
        `Walk-in: ${patientData.patient.name} cadastrado (particular) e agendado — confirme a chegada na lista abaixo.`,
      );
      setWalkIn({
        name: "",
        cpf: "",
        birthDate: "",
        phone: "",
        providerId: "",
        time: "",
        reason: "Consulta walk-in",
        createPortalUser: false,
      });
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function updateStatus(id: string, status: string) {
    setBusy(id);
    setMsg(null);
    try {
      const res = await fetch(`/api/interno/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await load();
        return true;
      }
      const data = await res.json().catch(() => ({}));
      setMsg((data as { error?: string }).error ?? "Erro ao atualizar agendamento");
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function confirmArrival(id: string) {
    const ok = await updateStatus(id, "CONFIRMADO");
    if (ok) setMsg("Chegada confirmada — paciente aguardando atendimento.");
  }

  if (loading) return <LoadingState message="Carregando agenda..." />;

  return (
    <div className="space-y-8">
      {msg && <Alert tone="info">{msg}</Alert>}

      <Card id="walk-in">
        <SectionHeader
          title="Paciente particular (walk-in)"
          description="Chegou na clínica sem cadastro prévio e sem empresa PJ — cadastre e agende em um passo."
        />
        <form onSubmit={walkInAndSchedule} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              required
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
          <label className="block text-sm">
            <span className="text-[var(--text-secondary)]">Horário (vazio = agora)</span>
            <input
              type="time"
              className={fieldClass}
              value={walkIn.time}
              onChange={(e) => setWalkIn({ ...walkIn, time: e.target.value })}
            />
          </label>
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
            <Button type="submit" variant="portal" disabled={busy === "walkin"}>
              {busy === "walkin" ? "Processando..." : "Cadastrar e agendar agora"}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <SectionHeader title="Novo agendamento" description="Beneficiário já cadastrado (PJ ou particular)." />
        <form onSubmit={createAppointment} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block text-sm">
            <span className="text-[var(--text-secondary)]">Data</span>
            <input
              type="date"
              className="mt-1 w-full rounded border px-3 py-2"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setLoading(true);
              }}
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
            <span className="text-[var(--text-secondary)]">Beneficiário</span>
            <select
              required
              className="mt-1 w-full rounded border px-3 py-2"
              value={form.patientId}
              onChange={(e) => setForm({ ...form, patientId: e.target.value })}
            >
              <option value="">Selecione...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-[var(--text-secondary)]">Prestador</span>
            <select
              required
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
            <Button type="submit" variant="portal" disabled={busy === "create"}>
              {busy === "create" ? "Salvando..." : "Agendar"}
            </Button>
          </div>
        </form>
      </Card>

      <section>
        <SectionHeader title={`Agenda do dia (${date.split("-").reverse().join("/")})`} />
        {appointments.length === 0 ? (
          <EmptyState message="Nenhum agendamento nesta data." />
        ) : (
          <div className="mt-4 space-y-3">
            {appointments.map((a) => (
              <Card key={a.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{a.scheduledAtLabel}</p>
                    <p className="text-sm text-[var(--text-muted)]">
                      {a.patientName} · {a.providerName}
                      {a.modality === "TELE" ? " · Telemedicina" : ""}
                    </p>
                    {a.telemedicineUrl && (
                      <a
                        href={a.telemedicineUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-[var(--portal-accent)] hover:underline"
                      >
                        Entrar na sala virtual
                      </a>
                    )}
                    {a.reason && <p className="text-sm text-[var(--text-secondary)]">{a.reason}</p>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge value={a.status} map="appointment" />
                    {a.status === "AGENDADO" && (
                      <Button
                        type="button"
                        variant="portal"
                        size="sm"
                        disabled={busy === a.id}
                        onClick={() => confirmArrival(a.id)}
                      >
                        Confirmar chegada
                      </Button>
                    )}
                    <select
                      className="rounded border px-2 py-1 text-sm"
                      value={a.status}
                      disabled={busy === a.id}
                      onChange={(e) => updateStatus(a.id, e.target.value)}
                    >
                      <option value="AGENDADO">Agendado</option>
                      <option value="CONFIRMADO">Confirmado</option>
                      <option value="REALIZADO">Realizado</option>
                      <option value="FALTOU">Faltou</option>
                      <option value="CANCELADO">Cancelado</option>
                    </select>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
