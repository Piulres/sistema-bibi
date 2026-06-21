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
  patientName: string;
  providerName: string;
  reason: string | null;
};

type Option = { id: string; name: string };

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

  async function updateStatus(id: string, status: string) {
    setBusy(id);
    try {
      const res = await fetch(`/api/interno/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) await load();
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <LoadingState message="Carregando agenda..." />;

  return (
    <div className="space-y-8">
      {msg && <Alert tone="info">{msg}</Alert>}

      <Card>
        <SectionHeader title="Novo agendamento" />
        <form onSubmit={createAppointment} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block text-sm">
            <span className="text-[var(--text-secondary)]">Data</span>
            <input type="date" className="mt-1 w-full rounded border px-3 py-2" value={date} onChange={(e) => { setDate(e.target.value); setLoading(true); }} />
          </label>
          <label className="block text-sm">
            <span className="text-[var(--text-secondary)]">Horário</span>
            <input type="time" required className="mt-1 w-full rounded border px-3 py-2" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          </label>
          <label className="block text-sm">
            <span className="text-[var(--text-secondary)]">Beneficiário</span>
            <select required className="mt-1 w-full rounded border px-3 py-2" value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}>
              <option value="">Selecione...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-[var(--text-secondary)]">Prestador</span>
            <select required className="mt-1 w-full rounded border px-3 py-2" value={form.providerId} onChange={(e) => setForm({ ...form, providerId: e.target.value })}>
              <option value="">Selecione...</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-[var(--text-secondary)]">Motivo</span>
            <input className="mt-1 w-full rounded border px-3 py-2" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
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
                    </p>
                    {a.reason && <p className="text-sm text-[var(--text-secondary)]">{a.reason}</p>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge value={a.status} map="appointment" />
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
