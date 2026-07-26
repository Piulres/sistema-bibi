"use client";

import { useCallback, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import SectionHeader from "@/components/ui/SectionHeader";
import EmptyState from "@/components/ui/EmptyState";
import ViewStateBoundary from "@/components/ui/ViewStateBoundary";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { useLabels } from "@/hooks/useLabels";
import { fetchJson } from "@/lib/ui/api-feedback";
import { confirmPresets } from "@/lib/ui/confirm-presets";
import {
  DEFAULT_END_MINUTE,
  DEFAULT_SLOT_MINUTES,
  DEFAULT_START_MINUTE,
  minutesToLabel,
  parseTimeToMinutes,
  WEEKDAY_LABELS_PT,
} from "@/lib/availability/slot-grid";

type WindowRow = {
  weekday: number;
  startMinute: number;
  endMinute: number;
  slotMinutes: number;
  active: boolean;
};

type BlockRow = {
  id: string;
  startsAt: string;
  endsAt: string;
  reason: string | null;
};

type AvailabilityPayload = {
  windows?: WindowRow[];
  defaults?: WindowRow[];
  usingDefault?: boolean;
};

type DayDraft = {
  enabled: boolean;
  start: string;
  end: string;
  slotMinutes: number;
};

function emptyWeek(): DayDraft[] {
  return Array.from({ length: 7 }, (_, weekday) => ({
    enabled: weekday >= 1 && weekday <= 5,
    start: minutesToLabel(DEFAULT_START_MINUTE),
    end: minutesToLabel(DEFAULT_END_MINUTE),
    slotMinutes: DEFAULT_SLOT_MINUTES,
  }));
}

function windowsToDraft(windows: WindowRow[], usingDefault: boolean, defaults: WindowRow[]): DayDraft[] {
  const draft = emptyWeek();
  const source = usingDefault || windows.length === 0 ? defaults : windows;
  for (const d of draft) {
    d.enabled = false;
  }
  for (const w of source.filter((row) => row.active !== false)) {
    const day = draft[w.weekday];
    if (!day) continue;
    day.enabled = true;
    day.start = minutesToLabel(w.startMinute);
    day.end = minutesToLabel(w.endMinute);
    day.slotMinutes = w.slotMinutes || DEFAULT_SLOT_MINUTES;
  }
  return draft;
}

const fieldClass =
  "mt-1 w-full rounded-[var(--radius-button)] border border-[var(--border-muted)] bg-[var(--surface-card)] px-3 py-2 text-sm";

export default function DisponibilidadeView() {
  const { labels } = useLabels();
  const { isBusy, run, showToast } = useAsyncAction();
  /** null = espelha a API; preenchido só após edição local. */
  const [daysDraft, setDaysDraft] = useState<DayDraft[] | null>(null);
  const [previewDate, setPreviewDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [blockForm, setBlockForm] = useState({
    startsAt: "",
    endsAt: "",
    reason: "",
  });

  const loadAvailability = useCallback(
    () =>
      fetchJson<AvailabilityPayload>(
        "/api/prestador/availability",
        undefined,
        "Erro ao carregar disponibilidade",
      ),
    [],
  );

  const { data, loading, error, reload } = useAsyncData(loadAvailability, []);

  const days = useMemo(
    () =>
      daysDraft ??
      windowsToDraft(
        data?.windows ?? [],
        Boolean(data?.usingDefault),
        data?.defaults ?? [],
      ),
    [daysDraft, data],
  );

  const loadBlocks = useCallback(
    () =>
      fetchJson<{ blocks?: BlockRow[] }>(
        "/api/prestador/availability/blocks",
        undefined,
        "Erro ao carregar bloqueios",
      ),
    [],
  );
  const {
    data: blocksData,
    loading: blocksLoading,
    error: blocksError,
    reload: reloadBlocks,
  } = useAsyncData(loadBlocks, []);

  const loadPreview = useCallback(
    () =>
      fetchJson<{ count?: number; usingDefault?: boolean; slots?: { label: string }[] }>(
        `/api/prestador/availability/preview?date=${encodeURIComponent(previewDate)}`,
        undefined,
        "Erro ao pré-visualizar slots",
      ),
    [previewDate],
  );
  const {
    data: preview,
    loading: previewLoading,
    error: previewError,
    reload: reloadPreview,
  } = useAsyncData(loadPreview, [previewDate]);

  const usingDefault = Boolean(data?.usingDefault);
  const blocks = blocksData?.blocks ?? [];

  const summary = useMemo(() => {
    const enabled = days.filter((d) => d.enabled).length;
    return `${enabled} dia(s) com atendimento`;
  }, [days]);

  function updateDay(weekday: number, patch: Partial<DayDraft>) {
    setDaysDraft((prev) => {
      const base =
        prev ??
        windowsToDraft(
          data?.windows ?? [],
          Boolean(data?.usingDefault),
          data?.defaults ?? [],
        );
      return base.map((d, idx) => (idx === weekday ? { ...d, ...patch } : d));
    });
  }

  async function saveWeek(e: React.FormEvent) {
    e.preventDefault();
    const windows: WindowRow[] = [];
    for (let weekday = 0; weekday < 7; weekday++) {
      const day = days[weekday]!;
      if (!day.enabled) continue;
      const startMinute = parseTimeToMinutes(day.start);
      const endMinute = parseTimeToMinutes(day.end);
      if (startMinute == null || endMinute == null) {
        showToast({ message: `Horário inválido em ${WEEKDAY_LABELS_PT[weekday]}`, tone: "danger" });
        return;
      }
      windows.push({
        weekday,
        startMinute,
        endMinute,
        slotMinutes: day.slotMinutes || DEFAULT_SLOT_MINUTES,
        active: true,
      });
    }

    await run(
      "save-week",
      () =>
        fetch("/api/prestador/availability", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ windows }),
        }),
      {
        successMessage: "Grade semanal salva",
        onSuccess: async () => {
          setDaysDraft(null);
          await reload();
          await reloadPreview();
        },
      },
    );
  }

  function applyDefaults() {
    setDaysDraft(windowsToDraft([], true, data?.defaults ?? []));
  }

  async function createBlock(e: React.FormEvent) {
    e.preventDefault();
    await run(
      "create-block",
      () =>
        fetch("/api/prestador/availability/blocks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startsAt: new Date(blockForm.startsAt).toISOString(),
            endsAt: new Date(blockForm.endsAt).toISOString(),
            reason: blockForm.reason || null,
          }),
        }),
      {
        successMessage: "Bloqueio criado",
        onSuccess: async () => {
          setBlockForm({ startsAt: "", endsAt: "", reason: "" });
          await reloadBlocks();
          await reloadPreview();
        },
      },
    );
  }

  async function removeBlock(id: string) {
    await run(
      `del-${id}`,
      () => fetch(`/api/prestador/availability/blocks/${id}`, { method: "DELETE" }),
      {
        confirm: confirmPresets.delete("este bloqueio"),
        successMessage: "Bloqueio removido",
        onSuccess: async () => {
          await reloadBlocks();
          await reloadPreview();
        },
      },
    );
  }

  return (
    <div className="space-y-8">
      <ViewStateBoundary
        loading={loading}
        error={error}
        loadingMessage="Carregando disponibilidade..."
        onRetry={() => void reload()}
      >
        <Card>
          <SectionHeader
            title="Grade semanal"
            description={`Defina quando você atende. Beneficiários só veem horários livres dentro desta grade (e fora de bloqueios). ${summary}.`}
          />
          {usingDefault ? (
            <p className="mt-3 rounded-[var(--radius-button)] bg-[var(--status-info-bg)] px-3 py-2 text-sm text-[var(--status-info-text)]">
              Ainda não há grade salva — o sistema usa o padrão 08:00–18:00 (seg–sex). Salve para
              publicar sua disponibilidade.
            </p>
          ) : null}

          <form onSubmit={saveWeek} className="mt-4 space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="text-left text-[var(--text-muted)]">
                    <th className="py-2 pr-2 font-medium">Dia</th>
                    <th className="py-2 pr-2 font-medium">Atende</th>
                    <th className="py-2 pr-2 font-medium">Início</th>
                    <th className="py-2 pr-2 font-medium">Fim</th>
                    <th className="py-2 font-medium">Duração do slot</th>
                  </tr>
                </thead>
                <tbody>
                  {WEEKDAY_LABELS_PT.map((label, weekday) => {
                    const day = days[weekday]!;
                    return (
                      <tr key={label} className="border-t border-[var(--border-muted)]">
                        <td className="py-2 pr-2 font-medium text-[var(--text-primary)]">{label}</td>
                        <td className="py-2 pr-2">
                          <input
                            type="checkbox"
                            checked={day.enabled}
                            onChange={(e) => updateDay(weekday, { enabled: e.target.checked })}
                            aria-label={`Atende ${label}`}
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            type="time"
                            className={fieldClass}
                            disabled={!day.enabled}
                            value={day.start}
                            onChange={(e) => updateDay(weekday, { start: e.target.value })}
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            type="time"
                            className={fieldClass}
                            disabled={!day.enabled}
                            value={day.end}
                            onChange={(e) => updateDay(weekday, { end: e.target.value })}
                          />
                        </td>
                        <td className="py-2">
                          <select
                            className={fieldClass}
                            disabled={!day.enabled}
                            value={day.slotMinutes}
                            onChange={(e) =>
                              updateDay(weekday, { slotMinutes: Number(e.target.value) })
                            }
                          >
                            <option value={15}>15 min</option>
                            <option value={30}>30 min</option>
                            <option value={45}>45 min</option>
                            <option value={60}>60 min</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" variant="portal" disabled={isBusy("save-week")}>
                {isBusy("save-week") ? "Salvando…" : "Salvar grade"}
              </Button>
              <Button type="button" variant="secondary" onClick={applyDefaults}>
                Restaurar padrão seg–sex 08–18
              </Button>
            </div>
          </form>
        </Card>
      </ViewStateBoundary>

      <Card>
        <SectionHeader
          title="Prévia de horários"
          description={`Slots que o beneficiário verá ao agendar ${labels.appointment.toLowerCase()} com você.`}
        />
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="block text-sm">
            <span className="text-[var(--text-secondary)]">Data</span>
            <input
              type="date"
              className={fieldClass}
              value={previewDate}
              onChange={(e) => setPreviewDate(e.target.value)}
            />
          </label>
          <Button type="button" variant="secondary" size="sm" onClick={() => void reloadPreview()}>
            Atualizar
          </Button>
        </div>
        <ViewStateBoundary
          loading={previewLoading}
          error={previewError}
          loadingMessage="Calculando slots..."
          onRetry={() => void reloadPreview()}
        >
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            {preview?.count ?? 0} horário(s) livre(s)
            {preview?.usingDefault ? " · usando grade padrão" : ""}
          </p>
          {(preview?.slots?.length ?? 0) === 0 ? (
            <EmptyState
              title="Nenhum horário neste dia"
              message="Ajuste a grade, remova bloqueios ou escolha outra data."
            />
          ) : (
            <ul className="mt-3 flex flex-wrap gap-2">
              {preview?.slots?.slice(0, 48).map((s) => (
                <li
                  key={s.label}
                  className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs text-[var(--text-secondary)]"
                >
                  {s.label}
                </li>
              ))}
            </ul>
          )}
        </ViewStateBoundary>
      </Card>

      <ViewStateBoundary
        loading={blocksLoading}
        error={blocksError}
        loadingMessage="Carregando bloqueios..."
        onRetry={() => void reloadBlocks()}
      >
        <Card>
          <SectionHeader
            title="Bloqueios pontuais"
            description="Almoço, folga ou férias — esses intervalos saem da grade de slots."
          />
          <form onSubmit={createBlock} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block text-sm">
              <span className="text-[var(--text-secondary)]">Início</span>
              <input
                required
                type="datetime-local"
                className={fieldClass}
                value={blockForm.startsAt}
                onChange={(e) => setBlockForm({ ...blockForm, startsAt: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="text-[var(--text-secondary)]">Fim</span>
              <input
                required
                type="datetime-local"
                className={fieldClass}
                value={blockForm.endsAt}
                onChange={(e) => setBlockForm({ ...blockForm, endsAt: e.target.value })}
              />
            </label>
            <label className="block text-sm sm:col-span-2 lg:col-span-1">
              <span className="text-[var(--text-secondary)]">Motivo (opcional)</span>
              <input
                className={fieldClass}
                value={blockForm.reason}
                onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
                placeholder="Almoço, congresso…"
              />
            </label>
            <div className="flex items-end">
              <Button type="submit" variant="portal" disabled={isBusy("create-block")}>
                {isBusy("create-block") ? "Salvando…" : "Bloquear"}
              </Button>
            </div>
          </form>

          {blocks.length === 0 ? (
            <EmptyState className="mt-4" message="Nenhum bloqueio cadastrado." />
          ) : (
            <ul className="mt-4 divide-y divide-[var(--border-muted)]">
              {blocks.map((b) => (
                <li
                  key={b.id}
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {new Date(b.startsAt).toLocaleString("pt-BR")} →{" "}
                      {new Date(b.endsAt).toLocaleString("pt-BR")}
                    </p>
                    {b.reason ? (
                      <p className="text-xs text-[var(--text-muted)]">{b.reason}</p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isBusy(`del-${b.id}`)}
                    onClick={() => void removeBlock(b.id)}
                  >
                    Remover
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </ViewStateBoundary>
    </div>
  );
}
