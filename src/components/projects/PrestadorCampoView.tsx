"use client";

import { useCallback, useEffect, useState } from "react";
import Alert from "@/components/ui/Alert";
import LoadingState from "@/components/ui/LoadingState";
import { FIELD_TRADES } from "@/lib/project/constants";

type Project = {
  id: string;
  code: string;
  name: string;
  statusLabel: string;
  progressPercent: number;
  addressCity: string | null;
  addressState: string | null;
  activeTaskId: string | null;
  activeTaskName: string | null;
  billingMode: string;
  dailyRate: number | null;
};

type Report = {
  id: string;
  reportDate: string;
  tradeLabel: string;
  projectCode: string;
  workDone: string;
  statusLabel: string;
  diariaAmount: number | null;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function PrestadorCampoView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    projectId: "",
    taskId: "",
    reportDate: todayIso(),
    trade: "PEDREIRO",
    locationNote: "",
    workDone: "",
    pendingWork: "",
    progressPercent: "",
    diariaAmount: "",
  });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [lastReportId, setLastReportId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [pRes, rRes] = await Promise.all([
      fetch("/api/prestador/campo/projects"),
      fetch("/api/prestador/field-reports"),
    ]);
    const pJson = await pRes.json();
    const rJson = await rRes.json();
    if (!pRes.ok) throw new Error(pJson.error ?? "Erro ao carregar obras");
    if (!rRes.ok) throw new Error(rJson.error ?? "Erro ao carregar registros");
    const projectList = pJson.projects as Project[];
    setProjects(projectList);
    setReports(rJson.reports as Report[]);
    setForm((f) => {
      if (f.projectId || projectList.length === 0) return f;
      const p = projectList[0];
      return {
        ...f,
        projectId: p.id,
        taskId: p.activeTaskId ?? "",
        diariaAmount: p.dailyRate != null ? String(p.dailyRate) : "",
      };
    });
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await load();
        if (active) setError(null);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Erro ao carregar");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [load]);

  function captureLocation() {
    if (!navigator.geolocation) {
      setMsg("Geolocalização não disponível neste dispositivo");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setMsg("Localização capturada");
      },
      () => setMsg("Não foi possível obter a localização"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function submitReport(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/prestador/field-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: form.projectId,
          taskId: form.taskId || null,
          reportDate: form.reportDate,
          trade: form.trade,
          locationNote: form.locationNote || null,
          latitude: coords?.lat ?? null,
          longitude: coords?.lng ?? null,
          workDone: form.workDone,
          pendingWork: form.pendingWork || null,
          progressPercent: form.progressPercent ? Number(form.progressPercent) : null,
          diariaAmount: form.diariaAmount ? Number(form.diariaAmount) : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMsg(json.error ?? "Erro ao enviar registro");
        return;
      }
      setLastReportId(json.report.id as string);
      setMsg("Registro de campo enviado. Adicione fotos abaixo se necessário.");
      setForm((f) => ({ ...f, workDone: "", pendingWork: "", progressPercent: "" }));
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !lastReportId) return;
    setBusy(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("reportId", lastReportId);
      const res = await fetch("/api/prestador/field-reports/attachments", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) setMsg(json.error ?? "Erro no upload");
      else setMsg(`Foto ${file.name} anexada`);
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  const selected = projects.find((p) => p.id === form.projectId);

  if (loading) return <LoadingState message="Carregando obras…" />;
  if (error) return <Alert tone="danger">{error}</Alert>;

  return (
    <div className="space-y-8">
      <p className="text-sm text-[var(--text-secondary)]">
        Registre sua diária: onde está, o que executou e o que falta na obra.
      </p>

      {msg && <Alert tone="info">{msg}</Alert>}

      {projects.length === 0 ? (
        <Alert tone="warning">Nenhuma obra alocada para você no momento.</Alert>
      ) : (
        <form
          onSubmit={submitReport}
          className="space-y-4 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4"
        >
          <h3 className="font-semibold text-[var(--text-primary)]">Novo registro de campo</h3>

          <label className="block text-sm">
            Obra
            <select
              required
              value={form.projectId}
              onChange={(e) => {
                const p = projects.find((x) => x.id === e.target.value);
                setForm((f) => ({
                  ...f,
                  projectId: e.target.value,
                  taskId: p?.activeTaskId ?? "",
                  diariaAmount:
                    p?.dailyRate != null ? String(p.dailyRate) : f.diariaAmount,
                }));
              }}
              className="mt-1 w-full rounded border px-3 py-2"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
          </label>

          {selected && (
            <p className="text-xs text-[var(--text-muted)]">
              {selected.addressCity}
              {selected.addressState ? ` / ${selected.addressState}` : ""} · {selected.statusLabel} ·{" "}
              {selected.progressPercent}%
              {selected.activeTaskName ? ` · Tarefa: ${selected.activeTaskName}` : ""}
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Data
              <input
                type="date"
                required
                value={form.reportDate}
                onChange={(e) => setForm((f) => ({ ...f, reportDate: e.target.value }))}
                className="mt-1 w-full rounded border px-3 py-2"
              />
            </label>
            <label className="text-sm">
              Ofício
              <select
                value={form.trade}
                onChange={(e) => setForm((f) => ({ ...f, trade: e.target.value }))}
                className="mt-1 w-full rounded border px-3 py-2"
              >
                {FIELD_TRADES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <label className="flex-1 text-sm">
              Onde está / local na obra
              <input
                value={form.locationNote}
                onChange={(e) => setForm((f) => ({ ...f, locationNote: e.target.value }))}
                placeholder="Ex.: 12º andar — área molhada"
                className="mt-1 w-full rounded border px-3 py-2"
              />
            </label>
            <button
              type="button"
              onClick={captureLocation}
              className="rounded-md border px-3 py-2 text-sm hover:bg-[var(--surface-muted)]"
            >
              GPS
            </button>
          </div>
          {coords && (
            <p className="text-xs text-[var(--text-muted)]">
              Coordenadas: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
            </p>
          )}

          <label className="block text-sm">
            O que foi feito hoje
            <textarea
              required
              rows={3}
              value={form.workDone}
              onChange={(e) => setForm((f) => ({ ...f, workDone: e.target.value }))}
              className="mt-1 w-full rounded border px-3 py-2"
              placeholder="Descreva a execução do dia…"
            />
          </label>

          <label className="block text-sm">
            Pendências / próximos passos
            <textarea
              rows={2}
              value={form.pendingWork}
              onChange={(e) => setForm((f) => ({ ...f, pendingWork: e.target.value }))}
              className="mt-1 w-full rounded border px-3 py-2"
              placeholder="O que falta fazer, materiais necessários…"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Progresso da tarefa (%)
              <input
                type="number"
                min={0}
                max={100}
                value={form.progressPercent}
                onChange={(e) => setForm((f) => ({ ...f, progressPercent: e.target.value }))}
                className="mt-1 w-full rounded border px-3 py-2"
              />
            </label>
            <label className="text-sm">
              Valor da diária (R$)
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.diariaAmount}
                onChange={(e) => setForm((f) => ({ ...f, diariaAmount: e.target.value }))}
                className="mt-1 w-full rounded border px-3 py-2"
                placeholder={
                  selected?.dailyRate != null
                    ? `Sugerido: R$ ${selected.dailyRate.toFixed(2)}`
                    : "Cobrança por dia"
                }
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 sm:w-auto"
          >
            Enviar registro
          </button>

          {lastReportId && (
            <label className="block text-sm">
              Foto do andamento
              <input
                type="file"
                accept="image/*"
                disabled={busy}
                onChange={uploadPhoto}
                className="mt-1 block w-full text-sm"
              />
            </label>
          )}
        </form>
      )}

      <section>
        <h3 className="mb-3 font-semibold text-[var(--text-primary)]">Meus registros recentes</h3>
        {reports.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">Nenhum registro ainda.</p>
        ) : (
          <ul className="divide-y rounded-xl border border-[var(--border-default)]">
            {reports.map((r) => (
              <li key={r.id} className="px-4 py-3 text-sm">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-medium">
                    {r.projectCode} · {r.tradeLabel}
                  </span>
                  <span className="text-[var(--text-muted)]">{r.statusLabel}</span>
                </div>
                <p className="mt-1 text-[var(--text-secondary)]">{r.workDone}</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {new Date(r.reportDate).toLocaleDateString("pt-BR")}
                  {r.diariaAmount != null ? ` · Diária R$ ${r.diariaAmount.toFixed(2)}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
