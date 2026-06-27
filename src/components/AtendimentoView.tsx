"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ExportButtons from "@/components/ExportButtons";
import ViewStateBoundary from "@/components/ui/ViewStateBoundary";
import StatusBadge from "@/components/ui/StatusBadge";
import SectionHeader from "@/components/ui/SectionHeader";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { buildAtendimentoBreadcrumbs } from "@/lib/navigation";
import {
  buildPepTemplate,
  PEP_RECORD_TYPES,
  type PepRecordType,
} from "@/lib/pep-templates";
import FlowStepper from "@/components/ui/FlowStepper";
import { CARE_JOURNEY_STEPS, resolveCareJourneyStep } from "@/lib/care-journey";
import TabBar from "@/components/ui/TabBar";
import ClinicalSidebar, { type ClinicalSidebarData } from "@/components/clinical/ClinicalSidebar";
import ClinicalCarePanel from "@/components/clinical/ClinicalCarePanel";
import { useDraftUndo } from "@/hooks/useDraftUndo";
import VoaAssistantPanel from "@/components/voa/VoaAssistantPanel";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { fetchJson } from "@/lib/ui/api-feedback";

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
  pet?: { id: string; name: string; species: string; breed: string | null } | null;
  usages: Usage[];
  records: RecordItem[];
};
type Procedure = {
  id: string;
  name: string;
  category: string;
  basePriceLabel: string;
};

type StockProduct = {
  id: string;
  name: string;
  sku: string;
  unit: string;
  stockLabel: string;
};

type Dispensation = {
  id: string;
  productName: string;
  quantity: number;
  unit: string;
  createdAt: string;
};

const currency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const CARE_TABS = [
  { key: "procedimentos", label: "Procedimentos" },
  { key: "materiais", label: "Materiais" },
  { key: "voa", label: "Assistente IA" },
  { key: "prontuario", label: "Prontuário" },
  { key: "medicacao", label: "Medicação" },
  { key: "exames", label: "Exames" },
  { key: "protocolos", label: "Protocolos" },
  { key: "perfil", label: "Perfil clínico" },
] as const;

type CareTab = (typeof CARE_TABS)[number]["key"] | "vacinas";

const fieldClass =
  "w-full rounded-[var(--radius-button)] border border-[var(--border-muted)] bg-[var(--surface-card)] px-3 py-2 text-[var(--text-primary)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)]";

export default function AtendimentoView({ appointmentId }: { appointmentId: string }) {
  const { isBusy, run, showToast } = useAsyncAction();
  const [selectedProc, setSelectedProc] = useState("");
  const pepDraft = useDraftUndo({
    storageKey: `pep-draft-${appointmentId}`,
    initialValue: "",
  });
  const note = pepDraft.value;
  const setNote = pepDraft.setValue;
  const [recordType, setRecordType] = useState<PepRecordType>("EVOLUCAO");
  const [recordTitle, setRecordTitle] = useState("");
  const [careTab, setCareTab] = useState<CareTab>("procedimentos");
  const [clinicalLoading, setClinicalLoading] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [materialQty, setMaterialQty] = useState("1");

  const loadAtendimento = useCallback(async () => {
    const [detailRes, procRes] = await Promise.all([
      fetchJson<Detail>(
        `/api/prestador/appointments/${appointmentId}`,
        undefined,
        "Erro ao carregar atendimento",
      ),
      fetchJson<{ procedures?: Procedure[] }>("/api/procedures"),
    ]);

    if (!detailRes.ok) return detailRes;

    const matRes = await fetchJson<{
      products?: StockProduct[];
      dispensations?: Dispensation[];
    }>(`/api/prestador/appointments/${appointmentId}/materials`);

    const detail = detailRes.data as unknown as Detail;
    const clinicalId = detail.pet?.id ?? detail.patient?.id;
    let clinicalSidebar: ClinicalSidebarData | null = null;

    if (clinicalId) {
      const clinicalRes = await fetchJson<{ overview?: ClinicalSidebarData & { profile: ClinicalSidebarData["profile"] } }>(
        `/api/prestador/patients/${clinicalId}/clinical-overview`,
      );
      if (clinicalRes.ok && clinicalRes.data.overview) {
        const o = clinicalRes.data.overview;
        clinicalSidebar = {
          profile: { ...o.profile, bloodType: o.profile.bloodType ?? null },
          activeMedications: o.activeMedications,
          pendingExams: o.pendingExams,
          activeProtocols: o.activeProtocols ?? [],
          vaccines: o.vaccines,
        };
      }
    }

    return {
      ok: true as const,
      data: {
        detail,
        procedures: procRes.ok ? (procRes.data.procedures ?? []) : [],
        stockProducts: matRes.ok ? (matRes.data.products ?? []) : [],
        dispensations: matRes.ok ? (matRes.data.dispensations ?? []) : [],
        clinicalSidebar,
      },
      status: detailRes.status,
    };
  }, [appointmentId]);

  const { data, loading, error, reload, setData } = useAsyncData(loadAtendimento, [appointmentId]);

  const detail = data?.detail ?? null;
  const procedures = data?.procedures ?? [];
  const stockProducts = data?.stockProducts ?? [];
  const dispensations = data?.dispensations ?? [];
  const clinicalSidebar = data?.clinicalSidebar ?? null;

  const loadClinical = useCallback(async (clinicalId: string) => {
    setClinicalLoading(true);
    try {
      const res = await fetchJson<{ overview?: ClinicalSidebarData & { profile: ClinicalSidebarData["profile"] } }>(
        `/api/prestador/patients/${clinicalId}/clinical-overview`,
      );
      if (res.ok && res.data.overview) {
        const o = res.data.overview;
        const sidebar: ClinicalSidebarData = {
          profile: { ...o.profile, bloodType: o.profile.bloodType ?? null },
          activeMedications: o.activeMedications,
          pendingExams: o.pendingExams,
          activeProtocols: o.activeProtocols ?? [],
          vaccines: o.vaccines,
        };
        setData((prev) => (prev ? { ...prev, clinicalSidebar: sidebar } : prev));
      }
    } finally {
      setClinicalLoading(false);
    }
  }, [setData]);

  const reloadDetail = useCallback(async () => {
    const detailRes = await fetchJson<Detail>(`/api/prestador/appointments/${appointmentId}`);
    if (detailRes.ok) {
      const detailData = detailRes.data as unknown as Detail;
      setData((prev) => (prev ? { ...prev, detail: detailData } : prev));
      const clinicalId = detailData.pet?.id ?? detailData.patient?.id;
      if (clinicalId) await loadClinical(clinicalId);
    }
  }, [appointmentId, loadClinical, setData]);

  const reloadMaterials = useCallback(async () => {
    const matRes = await fetchJson<{
      products?: StockProduct[];
      dispensations?: Dispensation[];
    }>(`/api/prestador/appointments/${appointmentId}/materials`);
    if (matRes.ok) {
      setData((prev) =>
        prev
          ? {
              ...prev,
              stockProducts: matRes.data.products ?? [],
              dispensations: matRes.data.dispensations ?? [],
            }
          : prev,
      );
    }
  }, [appointmentId, setData]);

  async function addProcedure() {
    if (!selectedProc) return;
    await run(
      "add-procedure",
      () =>
        fetch(`/api/prestador/appointments/${appointmentId}/procedures`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ procedureId: selectedProc }),
        }),
      {
        silentSuccess: true,
        onSuccess: async (body) => {
          const usage = body.usage as { procedure: string; priceLabel: string };
          let message = `Procedimento registrado: ${usage.procedure} (${usage.priceLabel})`;
          const stockConsumed = body.stockConsumed as { productName: string; quantity: number }[] | undefined;
          const stockWarnings = body.stockWarnings as string[] | undefined;
          if (stockConsumed?.length) {
            message += ` · Estoque: ${stockConsumed.map((c) => `${c.productName} (${c.quantity})`).join(", ")}`;
          }
          if (stockWarnings?.length) {
            message += ` · Avisos: ${stockWarnings.join("; ")}`;
          }
          showToast({ message, tone: "success" });
          setSelectedProc("");
          await reloadDetail();
          await reloadMaterials();
        },
      },
    );
  }

  async function addNote() {
    if (!note.trim() || !detail) return;
    await run(
      "add-note",
      () =>
        fetch("/api/prestador/records", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientId: detail.patient.id,
            appointmentId,
            content: note,
            recordType,
            title: recordTitle || null,
          }),
        }),
      {
        successMessage: "Anotação salva no prontuário",
        onSuccess: async () => {
          pepDraft.clearDraft();
          setRecordTitle("");
          await reloadDetail();
        },
      },
    );
  }

  async function dispenseMaterial() {
    if (!selectedMaterial) return;
    await run(
      "dispense-material",
      () =>
        fetch(`/api/prestador/appointments/${appointmentId}/materials`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: selectedMaterial,
            quantity: Number(materialQty),
          }),
        }),
      {
        successMessage: "Material dispensado e estoque atualizado.",
        onSuccess: async () => {
          setSelectedMaterial("");
          setMaterialQty("1");
          await reloadMaterials();
        },
      },
    );
  }

  async function markRealizado() {
    await run(
      "mark-realizado",
      () =>
        fetch(`/api/prestador/appointments/${appointmentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "REALIZADO" }),
        }),
      {
        successMessage: "Atendimento marcado como realizado.",
        onSuccess: async () => {
          await reloadDetail();
        },
      },
    );
  }

  async function confirmArrival() {
    await run(
      "confirm-arrival",
      () =>
        fetch(`/api/prestador/appointments/${appointmentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "CONFIRMADO" }),
        }),
      {
        successMessage: "Presença do paciente confirmada.",
        onSuccess: async () => {
          await reloadDetail();
        },
      },
    );
  }

  return (
    <ViewStateBoundary
      loading={loading}
      error={error}
      loadingMessage="Carregando atendimento..."
      onRetry={() => void reload()}
    >
      {detail && (() => {
  const total = detail.usages.reduce((s, u) => s + u.priceCharged, 0);
  const journeyStep = resolveCareJourneyStep({
    appointmentStatus: detail.appointment.status,
    hasUnbilledUsages: detail.usages.some((u) => !u.billed),
  });
  const hasPet = Boolean(detail.pet?.id);
  const careTabs = hasPet
    ? [
        ...CARE_TABS.filter((t) => t.key !== "protocolos"),
        { key: "vacinas" as const, label: "Vacinas" },
      ]
    : [...CARE_TABS];
  const historyHref = hasPet
    ? `/prestador/paciente/${detail.pet!.id}`
    : `/prestador/paciente/${detail.patient.id}`;

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={buildAtendimentoBreadcrumbs(detail.patient.name)}
        className="mb-2"
      />

      <Card padding="lg">
        <FlowStepper steps={[...CARE_JOURNEY_STEPS]} currentStepId={journeyStep} className="mb-4" />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              {hasPet ? detail.pet!.name : detail.patient.name}
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              {hasPet
                ? `Tutor: ${detail.patient.name} (CPF ${detail.patient.cpf})`
                : `CPF ${detail.patient.cpf}`}
              {detail.patient.company ? ` · ${detail.patient.company}` : hasPet ? "" : " · Particular"}
            </p>
            {hasPet && (
              <p className="text-xs text-[var(--text-muted)]">
                {[detail.pet!.species, detail.pet!.breed].filter(Boolean).join(" · ")}
              </p>
            )}
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {new Date(detail.appointment.scheduledAt).toLocaleString("pt-BR")} ·{" "}
              {detail.appointment.reason ?? "Consulta"}
            </p>
            <Link
              href={historyHref}
              className="mt-2 inline-block text-sm font-medium text-[var(--portal-accent)] hover:underline"
            >
              {hasPet ? "Ver histórico completo do pet →" : "Ver histórico completo do paciente →"}
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge value={detail.appointment.status} map="appointment" />
            {detail.appointment.status === "AGENDADO" && (
              <Button variant="secondary" size="sm" onClick={confirmArrival} disabled={isBusy("confirm-arrival")}>
                Paciente presente
              </Button>
            )}
            {detail.appointment.status !== "REALIZADO" && detail.appointment.status !== "CANCELADO" && (
              <Button variant="primary" size="sm" onClick={markRealizado} disabled={isBusy("mark-realizado")}>
                Marcar como realizado
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <ClinicalSidebar data={clinicalSidebar} loading={clinicalLoading} />

        <div className="space-y-4">
          <TabBar tabs={[...careTabs]} active={careTab} onSelect={(k) => setCareTab(k as CareTab)} aria-label="Abas do atendimento clínico" />

          {careTab === "procedimentos" && (
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
            <Button onClick={addProcedure} disabled={isBusy("add-procedure") || !selectedProc}>
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
          )}

          {careTab === "materiais" && (
        <Card padding="lg">
          <SectionHeader
            title="Dispensação de materiais"
            description="Baixa de estoque vinculada ao paciente — rastreabilidade por lote (FIFO)."
          />
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <select
              value={selectedMaterial}
              onChange={(e) => setSelectedMaterial(e.target.value)}
              className={`flex-1 ${fieldClass}`}
            >
              <option value="">Selecione o material...</option>
              {stockProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — {p.stockLabel}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={materialQty}
              onChange={(e) => setMaterialQty(e.target.value)}
              className={`w-24 ${fieldClass}`}
            />
            <Button onClick={dispenseMaterial} disabled={isBusy("dispense-material") || !selectedMaterial}>
              Dispensar
            </Button>
          </div>
          <ul className="mt-4 divide-y divide-[var(--border-default)]">
            {dispensations.length === 0 && (
              <li className="py-3 text-sm text-[var(--text-muted)]">
                Nenhum material dispensado neste atendimento.
              </li>
            )}
            {dispensations.map((d) => (
              <li key={d.id} className="flex items-center justify-between py-3 text-sm">
                <span className="font-medium text-[var(--text-secondary)]">{d.productName}</span>
                <span className="text-[var(--text-muted)]">
                  {d.quantity} {d.unit} · {new Date(d.createdAt).toLocaleString("pt-BR")}
                </span>
              </li>
            ))}
          </ul>
        </Card>
          )}

          {careTab === "voa" && (
            <VoaAssistantPanel
              appointmentId={appointmentId}
              patientId={detail.patient.id}
              onImported={reloadDetail}
            />
          )}

          {careTab === "prontuario" && (
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
            rows={6}
            placeholder="Registrar evolução clínica, conduta, prescrição..."
            className={`mt-3 ${fieldClass}`}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <Button onClick={addNote} disabled={isBusy("add-note") || !note.trim()}>
              Salvar no prontuário
            </Button>
            {pepDraft.canUndo && (
              <Button type="button" variant="secondary" onClick={pepDraft.undo} disabled={isBusy("add-note")}>
                Desfazer digitação
              </Button>
            )}
          </div>

          <ul className="mt-4 space-y-3">
            {detail.records.map((r) => (
              <li key={r.id} className="rounded-[var(--radius-button)] bg-[var(--surface-muted)] p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    {r.title && <p className="text-xs font-semibold text-[var(--portal-accent)]">{r.title}</p>}
                    <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{r.content}</p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {new Date(r.createdAt).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <ExportButtons
                    baseUrl={`/api/prestador/records/${r.id}/export`}
                    formats={["pdf"]}
                    variant="ghost"
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>
          )}

          {["medicacao", "exames", "protocolos", "perfil", "vacinas"].includes(careTab) && (
            <Card padding="lg">
              <ClinicalCarePanel
                patientId={detail.patient.id}
                petId={detail.pet?.id}
                subjectType={hasPet ? "pet" : "patient"}
                appointmentId={appointmentId}
                procedures={procedures}
                tab={careTab as "medicacao" | "exames" | "protocolos" | "perfil" | "vacinas"}
                onChanged={() => loadClinical(detail.pet?.id ?? detail.patient.id)}
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
      })()}
    </ViewStateBoundary>
  );
}
