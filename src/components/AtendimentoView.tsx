"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import StatusBadge from "@/components/ui/StatusBadge";
import SectionHeader from "@/components/ui/SectionHeader";
import {
  buildPepTemplate,
  PEP_RECORD_TYPES,
  type PepRecordType,
} from "@/lib/pep-templates";
import LoadingState from "@/components/ui/LoadingState";

type Usage = {
  id: string;
  procedure: string;
  category: string;
  priceCharged: number;
  priceLabel: string;
  billed: boolean;
};
type RecordItem = {
  id: string;
  content: string;
  createdAt: string;
  recordType?: string;
  title?: string | null;
};
type Detail = {
  appointment: { id: string; scheduledAt: string; status: string; reason: string | null };
  patient: { id: string; name: string; cpf: string; company: string | null };
  usages: Usage[];
  records: RecordItem[];
};
type Procedure = {
  id: string;
  name: string;
  category: string;
  basePriceLabel: string;
};

const currency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fieldClass =
  "w-full rounded-[var(--radius-button)] border border-[var(--border-muted)] bg-[var(--surface-card)] px-3 py-2 text-[var(--text-primary)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)]";

export default function AtendimentoView({ appointmentId }: { appointmentId: string }) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [selectedProc, setSelectedProc] = useState("");
  const [note, setNote] = useState("");
  const [recordType, setRecordType] = useState<PepRecordType>("EVOLUCAO");
  const [recordTitle, setRecordTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/prestador/appointments/${appointmentId}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Erro ao carregar");
      return;
    }
    setDetail(data);
  }, [appointmentId]);

  useEffect(() => {
    let active = true;
    (async () => {
      const [detailRes, procRes] = await Promise.all([
        fetch(`/api/prestador/appointments/${appointmentId}`),
        fetch("/api/procedures"),
      ]);
      const detailData = await detailRes.json();
      const procData = await procRes.json();
      if (!active) return;
      if (!detailRes.ok) setError(detailData.error ?? "Erro ao carregar");
      else setDetail(detailData);
      if (procData.procedures) setProcedures(procData.procedures);
    })();
    return () => {
      active = false;
    };
  }, [appointmentId]);

  async function addProcedure() {
    if (!selectedProc) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(
        `/api/prestador/appointments/${appointmentId}/procedures`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ procedureId: selectedProc }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error ?? "Erro ao registrar procedimento");
      } else {
        setMsg(`Procedimento registrado: ${data.usage.procedure} (${data.usage.priceLabel})`);
        setSelectedProc("");
        await load();
      }
    } finally {
      setBusy(false);
    }
  }

  async function addNote() {
    if (!note.trim() || !detail) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/prestador/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: detail.patient.id,
          appointmentId,
          content: note,
          recordType,
          title: recordTitle || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) setMsg(data.error ?? "Erro ao salvar anotação");
      else {
        setNote("");
        setRecordTitle("");
        await load();
      }
    } finally {
      setBusy(false);
    }
  }

  async function markRealizado() {
    setBusy(true);
    try {
      await fetch(`/api/prestador/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REALIZADO" }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (error) return <Alert tone="danger">{error}</Alert>;
  if (!detail) return <LoadingState message="Carregando atendimento..." />;

  const total = detail.usages.reduce((s, u) => s + u.priceCharged, 0);

  return (
    <div className="space-y-6">
      <Link
        href="/prestador"
        className="text-sm text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
      >
        ← Voltar para a agenda
      </Link>

      <Card padding="lg">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">{detail.patient.name}</h1>
            <p className="text-sm text-[var(--text-muted)]">
              CPF {detail.patient.cpf}
              {detail.patient.company ? ` · ${detail.patient.company}` : " · Particular"}
            </p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {new Date(detail.appointment.scheduledAt).toLocaleString("pt-BR")} ·{" "}
              {detail.appointment.reason ?? "Consulta"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge value={detail.appointment.status} map="appointment" />
            {detail.appointment.status !== "REALIZADO" && (
              <Button variant="primary" size="sm" onClick={markRealizado} disabled={busy}>
                Marcar como realizado
              </Button>
            )}
          </div>
        </div>
      </Card>

      {msg && <Alert tone="success">{msg}</Alert>}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card padding="lg">
          <SectionHeader
            title="Procedimentos (Pay Per Use)"
            description="Cada procedimento utilizado é cobrado com transparência prévia."
          />

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <select
              value={selectedProc}
              onChange={(e) => setSelectedProc(e.target.value)}
              className={`flex-1 ${fieldClass}`}
            >
              <option value="">Selecione um procedimento...</option>
              {procedures.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.category}) — base {p.basePriceLabel}
                </option>
              ))}
            </select>
            <Button onClick={addProcedure} disabled={busy || !selectedProc}>
              Registrar
            </Button>
          </div>

          <ul className="mt-4 divide-y divide-[var(--border-default)]">
            {detail.usages.length === 0 && (
              <li className="py-3 text-sm text-[var(--text-muted)]">
                Nenhum procedimento registrado ainda.
              </li>
            )}
            {detail.usages.map((u) => (
              <li key={u.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-[var(--text-secondary)]">{u.procedure}</p>
                  <p className="text-xs text-[var(--text-muted)]">{u.category}</p>
                </div>
                <span className="font-semibold text-[var(--text-primary)]">{u.priceLabel}</span>
              </li>
            ))}
          </ul>

          {detail.usages.length > 0 && (
            <div className="mt-2 flex items-center justify-between border-t border-[var(--border-default)] pt-3">
              <span className="text-sm font-medium text-[var(--text-muted)]">
                Total do atendimento
              </span>
              <span className="text-lg font-bold text-[var(--brand-primary)]">{currency(total)}</span>
            </div>
          )}
        </Card>

        <Card padding="lg">
          <SectionHeader title="Prontuário Eletrônico (PEP)" />
          <div className="mt-3 flex flex-wrap gap-2">
            <select
              value={recordType}
              onChange={(e) => setRecordType(e.target.value as PepRecordType)}
              className={fieldClass}
            >
              {PEP_RECORD_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                const tpl = buildPepTemplate(recordType, {
                  patientName: detail.patient.name,
                  appointmentDate: new Date(detail.appointment.scheduledAt).toLocaleDateString("pt-BR"),
                });
                setRecordTitle(tpl.title);
                setNote(tpl.content);
              }}
            >
              Usar template
            </Button>
          </div>
          <input
            value={recordTitle}
            onChange={(e) => setRecordTitle(e.target.value)}
            placeholder="Título do registro (opcional)"
            className={`mt-3 ${fieldClass}`}
          />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Registrar evolução clínica, conduta, prescrição..."
            className={`mt-3 ${fieldClass}`}
          />
          <Button className="mt-2" onClick={addNote} disabled={busy || !note.trim()}>
            Salvar no prontuário
          </Button>

          <ul className="mt-4 space-y-3">
            {detail.records.map((r) => (
              <li key={r.id} className="rounded-[var(--radius-button)] bg-[var(--surface-muted)] p-3">
                {r.title && <p className="text-xs font-semibold text-[var(--portal-accent)]">{r.title}</p>}
                <p className="text-sm text-[var(--text-secondary)]">{r.content}</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {new Date(r.createdAt).toLocaleString("pt-BR")}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
