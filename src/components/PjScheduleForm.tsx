"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import SectionHeader from "@/components/ui/SectionHeader";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { useLabels } from "@/hooks/useLabels";
import { civilDateISO } from "@/lib/timezone";

type BeneficiaryOption = {
  id: string;
  name: string;
};

type ProviderOption = {
  id: string;
  name: string;
};

type ProcedureOption = {
  id: string;
  name: string;
};

type SlotOption = {
  start: string;
  label: string;
  providerId?: string;
};

type Props = {
  beneficiaries: BeneficiaryOption[];
  initialPatientId?: string;
};

export default function PjScheduleForm({ beneficiaries, initialPatientId }: Props) {
  const { labels } = useLabels();
  const { run, isBusy } = useAsyncAction();
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [procedures, setProcedures] = useState<ProcedureOption[]>([]);
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId ?? "");
  const [form, setForm] = useState({
    procedureId: "",
    providerId: "",
    noProviderPreference: true,
    date: civilDateISO(),
    slot: "",
    modality: "PRESENCIAL",
    reason: "",
  });

  const patientId = initialPatientId || selectedPatientId;

  useEffect(() => {
    let active = true;
    (async () => {
      const [providersRes, proceduresRes] = await Promise.all([
        fetch("/api/pj/providers"),
        fetch("/api/procedures"),
      ]);
      if (!active) return;
      if (providersRes.ok) {
        const data = (await providersRes.json()) as { providers?: ProviderOption[] };
        setProviders(data.providers ?? []);
      }
      if (proceduresRes.ok) {
        const data = (await proceduresRes.json()) as
          | { procedures?: ProcedureOption[] }
          | ProcedureOption[];
        setProcedures(Array.isArray(data) ? data : (data.procedures ?? []));
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!form.date) {
        if (active) setSlots([]);
        return;
      }
      if (!form.noProviderPreference && !form.providerId) {
        if (active) setSlots([]);
        return;
      }
      const query = form.noProviderPreference
        ? `date=${form.date}`
        : `providerId=${form.providerId}&date=${form.date}`;
      const res = await fetch(`/api/pj/slots?${query}`);
      const data = (await res.json()) as { slots?: SlotOption[] };
      if (!active) return;
      setSlots(data.slots ?? []);
      setForm((prev) => ({ ...prev, slot: "" }));
    })();
    return () => {
      active = false;
    };
  }, [form.providerId, form.date, form.noProviderPreference]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!patientId || !form.slot) return;
    const selectedSlot = slots.find((s) => s.start === form.slot);
    await run(
      "book",
      () =>
        fetch("/api/pj/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientId,
            providerId: form.noProviderPreference
              ? selectedSlot?.providerId
              : form.providerId,
            procedureId: form.procedureId || undefined,
            scheduledAt: form.slot,
            reason: form.reason || undefined,
            modality: form.modality,
            autoAssignProvider: form.noProviderPreference && !selectedSlot?.providerId,
          }),
        }),
      {
        successMessage: `${labels.appointment} confirmado(a) para o colaborador. Confirmação por e-mail enfileirada.`,
        onSuccess: () => {
          setForm((prev) => ({ ...prev, slot: "", reason: "" }));
        },
      },
    );
  }

  if (beneficiaries.length === 0) {
    return (
      <Card>
        <SectionHeader
          title={`Agendar ${labels.appointment.toLowerCase()}`}
          description={`Cadastre ${labels.beneficiaries.toLowerCase()} na empresa para solicitar horário.`}
        />
      </Card>
    );
  }

  return (
    <Card>
      <SectionHeader
        title={`Agendar ${labels.appointment.toLowerCase()}`}
        description={`RH agenda em nome de ${labels.beneficiaries.toLowerCase()} da empresa — confirmação automática sem a recepção.`}
      />
      <form onSubmit={onSubmit} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block text-sm sm:col-span-2 lg:col-span-3">
          <span className="text-[var(--text-secondary)]">{labels.beneficiary}</span>
          <select
            required
            className="mt-1 w-full rounded border px-3 py-2"
            value={patientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
          >
            <option value="">Selecione...</option>
            {beneficiaries.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-[var(--text-secondary)]">{labels.procedure} (opcional)</span>
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
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            checked={form.noProviderPreference}
            onChange={(e) =>
              setForm({
                ...form,
                noProviderPreference: e.target.checked,
                providerId: e.target.checked ? "" : form.providerId,
                slot: "",
              })
            }
          />
          <span className="text-[var(--text-secondary)]">
            Sem preferência de prestador (mostra horários de todos)
          </span>
        </label>
        <label className="block text-sm">
          <span className="text-[var(--text-secondary)]">Prestador</span>
          <select
            required={!form.noProviderPreference}
            disabled={form.noProviderPreference}
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
          <span className="text-[var(--text-secondary)]">Data</span>
          <input
            required
            type="date"
            className="mt-1 w-full rounded border px-3 py-2"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </label>
        <label className="block text-sm">
          <span className="text-[var(--text-secondary)]">Horário</span>
          <select
            required
            className="mt-1 w-full rounded border px-3 py-2"
            value={form.slot}
            onChange={(e) => setForm({ ...form, slot: e.target.value })}
          >
            <option value="">{slots.length ? "Selecione..." : "Sem horários"}</option>
            {slots.map((s) => (
              <option key={s.start} value={s.start}>
                {s.label}
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
        <label className="block text-sm sm:col-span-2 lg:col-span-3">
          <span className="text-[var(--text-secondary)]">Motivo (opcional)</span>
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            placeholder="Ex.: check-up ocupacional"
          />
        </label>
        <div className="flex items-end">
          <Button type="submit" variant="portal" disabled={isBusy("book") || !form.slot}>
            {isBusy("book") ? "Agendando..." : "Agendar"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
