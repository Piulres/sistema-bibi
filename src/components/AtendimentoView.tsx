"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Usage = {
  id: string;
  procedure: string;
  category: string;
  priceCharged: number;
  priceLabel: string;
  billed: boolean;
};
type RecordItem = { id: string; content: string; createdAt: string };
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

export default function AtendimentoView({ appointmentId }: { appointmentId: string }) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [selectedProc, setSelectedProc] = useState("");
  const [note, setNote] = useState("");
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
        }),
      });
      const data = await res.json();
      if (!res.ok) setMsg(data.error ?? "Erro ao salvar anotação");
      else {
        setNote("");
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

  if (error) return <p className="text-red-600">{error}</p>;
  if (!detail) return <p className="text-slate-500">Carregando atendimento...</p>;

  const total = detail.usages.reduce((s, u) => s + u.priceCharged, 0);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/prestador" className="text-sm text-slate-500 hover:text-slate-800">
          ← Voltar para a agenda
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{detail.patient.name}</h1>
            <p className="text-sm text-slate-500">
              CPF {detail.patient.cpf}
              {detail.patient.company ? ` · ${detail.patient.company}` : " · Particular"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {new Date(detail.appointment.scheduledAt).toLocaleString("pt-BR")} ·{" "}
              {detail.appointment.reason ?? "Consulta"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
              {detail.appointment.status}
            </span>
            {detail.appointment.status !== "REALIZADO" && (
              <button
                onClick={markRealizado}
                disabled={busy}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
              >
                Marcar como realizado
              </button>
            )}
          </div>
        </div>
      </div>

      {msg && (
        <p className="rounded-lg bg-teal-50 px-4 py-2 text-sm text-teal-800">{msg}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Procedimentos (Pay Per Use)
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Cada procedimento utilizado é cobrado com transparência prévia.
          </p>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <select
              value={selectedProc}
              onChange={(e) => setSelectedProc(e.target.value)}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-teal-500 focus:outline-none"
            >
              <option value="">Selecione um procedimento...</option>
              {procedures.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.category}) — base {p.basePriceLabel}
                </option>
              ))}
            </select>
            <button
              onClick={addProcedure}
              disabled={busy || !selectedProc}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
            >
              Registrar
            </button>
          </div>

          <ul className="mt-4 divide-y divide-slate-100">
            {detail.usages.length === 0 && (
              <li className="py-3 text-sm text-slate-400">
                Nenhum procedimento registrado ainda.
              </li>
            )}
            {detail.usages.map((u) => (
              <li key={u.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-slate-800">{u.procedure}</p>
                  <p className="text-xs text-slate-400">{u.category}</p>
                </div>
                <span className="font-semibold text-slate-900">{u.priceLabel}</span>
              </li>
            ))}
          </ul>

          {detail.usages.length > 0 && (
            <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-3">
              <span className="text-sm font-medium text-slate-500">Total do atendimento</span>
              <span className="text-lg font-bold text-teal-700">{currency(total)}</span>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Prontuário Eletrônico (PEP)
          </h2>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Registrar evolução clínica, conduta, prescrição..."
            className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-teal-500 focus:outline-none"
          />
          <button
            onClick={addNote}
            disabled={busy || !note.trim()}
            className="mt-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-500 disabled:opacity-60"
          >
            Salvar no prontuário
          </button>

          <ul className="mt-4 space-y-3">
            {detail.records.map((r) => (
              <li key={r.id} className="rounded-lg bg-slate-50 p-3">
                <p className="text-sm text-slate-800">{r.content}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {new Date(r.createdAt).toLocaleString("pt-BR")}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
