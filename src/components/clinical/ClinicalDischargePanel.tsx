"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import StatusBadge from "@/components/ui/StatusBadge";
import SectionHeader from "@/components/ui/SectionHeader";
import ExportButtons from "@/components/ExportButtons";
import { REFERRAL_TEMPLATES, type ReferralTemplate } from "@/lib/clinical/encaminhamento";
import { useLabels } from "@/hooks/useLabels";
import { useConfirm } from "@/hooks/useConfirm";
import { confirmPresets } from "@/lib/ui/confirm-presets";

const fieldClass =
  "w-full min-w-0 rounded-[var(--radius-button)] border border-[var(--border-muted)] bg-[var(--surface-card)] px-3 py-2.5 text-[var(--text-primary)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)]";

type DischargeDocument = {
  id: string;
  kind: string;
  kindLabel: string;
  title: string;
  summary: string;
  status: string;
  statusLabel: string;
  providerName: string;
  createdAtLabel: string;
  exportParams: {
    type: string;
    id: string;
    appointmentId?: string;
  };
};

type KindFilter = "ALL" | "RECEITA" | "PEDIDO_EXAME" | "ENCAMINHAMENTO" | "ATESTADO";

const KIND_FILTERS: { id: KindFilter; label: string }[] = [
  { id: "ALL", label: "Todas" },
  { id: "RECEITA", label: "Receitas" },
  { id: "PEDIDO_EXAME", label: "Exames" },
  { id: "ENCAMINHAMENTO", label: "Encaminhamentos" },
  { id: "ATESTADO", label: "Atestados" },
];

type Props = {
  patientId: string;
  appointmentId?: string;
  petId?: string;
  onChanged?: () => void;
};

export default function ClinicalDischargePanel({
  patientId,
  appointmentId,
  petId,
  onChanged,
}: Props) {
  const { labels } = useLabels();
  const { confirm } = useConfirm();
  const [documents, setDocuments] = useState<DischargeDocument[]>([]);
  const [templates, setTemplates] = useState<ReferralTemplate[]>(REFERRAL_TEMPLATES);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [kindFilter, setKindFilter] = useState<KindFilter>("ALL");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const [form, setForm] = useState({
    referralKind: "ESPECIALIDADE",
    specialty: "",
    urgency: "ROTINA",
    clinicalReason: "",
    historySummary: "",
    requestedActions: "",
  });

  const fetchDocuments = useCallback(async (): Promise<{
    documents: DischargeDocument[];
    referralTemplates?: ReferralTemplate[];
  }> => {
    const params = new URLSearchParams();
    if (appointmentId) params.set("appointmentId", appointmentId);
    if (petId) params.set("petId", petId);
    const qs = params.toString() ? `?${params}` : "";
    const res = await fetch(
      `/api/prestador/patients/${patientId}/discharge-documents${qs}`,
    );
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(
        (data as { error?: string } | null)?.error ??
          "Não foi possível carregar as guias deste atendimento.",
      );
    }
    return {
      documents: (data as { documents?: DischargeDocument[] }).documents ?? [],
      referralTemplates: (data as { referralTemplates?: ReferralTemplate[] })
        .referralTemplates,
    };
  }, [patientId, appointmentId, petId]);

  const applyDocumentsPayload = useCallback(
    (payload: {
      documents: DischargeDocument[];
      referralTemplates?: ReferralTemplate[];
    }) => {
      setDocuments(payload.documents);
      if (
        Array.isArray(payload.referralTemplates) &&
        payload.referralTemplates.length > 0
      ) {
        setTemplates(payload.referralTemplates);
      }
    },
    [],
  );

  const loadDocuments = useCallback(async () => {
    const payload = await fetchDocuments();
    applyDocumentsPayload(payload);
  }, [fetchDocuments, applyDocumentsPayload]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const payload = await fetchDocuments();
        if (!active) return;
        applyDocumentsPayload(payload);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Erro ao carregar guias");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [fetchDocuments, applyDocumentsPayload]);

  const filteredDocuments = useMemo(() => {
    if (kindFilter === "ALL") return documents;
    return documents.filter((doc) => doc.kind === kindFilter);
  }, [documents, kindFilter]);

  function applyTemplate(template: ReferralTemplate) {
    setSelectedTemplateId(template.id);
    setForm({
      referralKind: template.referralKind,
      specialty: template.specialty,
      urgency: template.urgency,
      clinicalReason: template.clinicalReason,
      historySummary: "",
      requestedActions: template.requestedActions,
    });
  }

  async function submitReferral() {
    setBusy(true);
    setMsg(null);
    setError(null);
    try {
      const res = await fetch(`/api/prestador/patients/${patientId}/referrals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId,
          petId,
          ...form,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao emitir encaminhamento");
        return;
      }
      setMsg(
        "Encaminhamento emitido. Imprima a guia e entregue em mãos ou oriente o acesso no painel.",
      );
      setSelectedTemplateId(null);
      setForm({
        referralKind: "ESPECIALIDADE",
        specialty: "",
        urgency: "ROTINA",
        clinicalReason: "",
        historySummary: "",
        requestedActions: "",
      });
      await loadDocuments();
      onChanged?.();
    } finally {
      setBusy(false);
    }
  }

  async function cancelReferral(id: string, specialty: string) {
    const ok = await confirm(confirmPresets.cancelReferral(specialty));
    if (!ok) return;

    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/prestador/referrals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELADO" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError((data as { error?: string } | null)?.error ?? "Erro ao cancelar");
        return;
      }
      setMsg("Encaminhamento cancelado.");
      await loadDocuments();
      onChanged?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Documentos de saída"
        description={`Receitas, pedidos de exame, encaminhamentos e atestados para entregar ao ${labels.patient.toLowerCase()} (impresso ou no painel).`}
      />

      {msg && (
        <Alert tone="success" role="status">
          {msg}
        </Alert>
      )}
      {error && (
        <Alert tone="danger" role="alert">
          {error}
          {!loading && (
            <button
              type="button"
              className="ml-2 underline"
              onClick={() => {
                setLoading(true);
                setError(null);
                void loadDocuments()
                  .catch((err) =>
                    setError(
                      err instanceof Error ? err.message : "Erro ao carregar guias",
                    ),
                  )
                  .finally(() => setLoading(false));
              }}
            >
              Tentar novamente
            </button>
          )}
        </Alert>
      )}

      {appointmentId && documents.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-button)] border border-[var(--border-default)] bg-[var(--surface-muted)] p-3">
          <p className="text-sm text-[var(--text-secondary)]">
            {documents.length} guia(s) deste atendimento — imprimir pacote completo
            (inclui atestado)
          </p>
          <ExportButtons
            baseUrl="/api/prestador/clinical-guides/export"
            query={{
              type: "bundle",
              patientId,
              appointmentId,
            }}
            formats={["pdf"]}
            variant="portal"
            showPrint
            ariaLabel="pacote do atendimento"
          />
        </div>
      )}

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-[var(--text-secondary)]">Guias emitidas</p>
          {documents.length > 0 && (
            <div className="flex flex-wrap gap-1" role="group" aria-label="Filtrar por tipo">
              {KIND_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  aria-pressed={kindFilter === filter.id}
                  onClick={() => setKindFilter(filter.id)}
                  className={`rounded-full border px-2.5 py-1 text-xs ${
                    kindFilter === filter.id
                      ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]"
                      : "border-[var(--border-muted)] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <p className="rounded-[var(--radius-button)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--text-muted)]">
            Carregando guias…
          </p>
        ) : filteredDocuments.length === 0 ? (
          <p className="rounded-[var(--radius-button)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--text-muted)]">
            {documents.length === 0
              ? "Nenhuma guia ainda. Emita receita (aba Medicação), solicite exames (aba Exames), atestado (Prontuário) ou crie um encaminhamento abaixo."
              : "Nenhuma guia neste filtro."}
          </p>
        ) : (
          <ul className="divide-y divide-[var(--border-default)] rounded-[var(--radius-button)] border border-[var(--border-muted)]">
            {filteredDocuments.map((doc) => (
              <li
                key={doc.id}
                className="flex flex-col gap-3 p-3 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge value={doc.kindLabel} label={doc.kindLabel} />
                    <StatusBadge value={doc.status} label={doc.statusLabel} />
                  </div>
                  <p className="font-medium text-[var(--text-primary)]">{doc.title}</p>
                  <p className="text-sm text-[var(--text-muted)]">{doc.summary}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {doc.providerName} · {doc.createdAtLabel}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <ExportButtons
                    baseUrl="/api/prestador/clinical-guides/export"
                    query={{
                      type: doc.exportParams.type,
                      id: doc.exportParams.id,
                      appointmentId: doc.exportParams.appointmentId,
                      patientId,
                    }}
                    formats={["pdf"]}
                    size="sm"
                    showPrint
                    ariaLabel={doc.title}
                  />
                  {doc.kind === "ENCAMINHAMENTO" && doc.status === "ATIVO" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busy}
                      aria-label={`Cancelar encaminhamento ${doc.title}`}
                      onClick={() =>
                        void cancelReferral(doc.exportParams.id, doc.title)
                      }
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-3 border-t border-[var(--border-default)] pt-4">
        <SectionHeader
          title="Novo encaminhamento"
          description="Templates por especialidade — emita, imprima e entregue em mãos."
        />

        <div className="flex flex-wrap gap-2" role="group" aria-label="Templates de encaminhamento">
          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              aria-pressed={selectedTemplateId === template.id}
              onClick={() => applyTemplate(template)}
              className={`rounded-full border px-3 py-1 text-xs ${
                selectedTemplateId === template.id
                  ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]"
                  : "border-[var(--border-muted)] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
              }`}
            >
              {template.label}
            </button>
          ))}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <label className="block space-y-1 text-sm">
            <span className="text-[var(--text-secondary)]">Tipo</span>
            <select
              className={fieldClass}
              value={form.referralKind}
              onChange={(e) => setForm({ ...form, referralKind: e.target.value })}
            >
              <option value="ESPECIALIDADE">Para especialidade</option>
              <option value="RETORNO">Retorno</option>
              <option value="SERVICO">Para serviço</option>
            </select>
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-[var(--text-secondary)]">Urgência</span>
            <select
              className={fieldClass}
              value={form.urgency}
              onChange={(e) => setForm({ ...form, urgency: e.target.value })}
            >
              <option value="ROTINA">Rotina</option>
              <option value="BREVE">Breve</option>
              <option value="URGENTE">Urgente</option>
            </select>
          </label>
          <label className="block space-y-1 text-sm sm:col-span-2">
            <span className="text-[var(--text-secondary)]">Especialidade / serviço</span>
            <input
              className={fieldClass}
              value={form.specialty}
              onChange={(e) => setForm({ ...form, specialty: e.target.value })}
            />
          </label>
          <label className="block space-y-1 text-sm sm:col-span-2">
            <span className="text-[var(--text-secondary)]">Motivo clínico</span>
            <textarea
              className={fieldClass}
              rows={3}
              value={form.clinicalReason}
              onChange={(e) => setForm({ ...form, clinicalReason: e.target.value })}
            />
          </label>
          <label className="block space-y-1 text-sm sm:col-span-2">
            <span className="text-[var(--text-secondary)]">Histórico relevante (opcional)</span>
            <textarea
              className={fieldClass}
              rows={2}
              value={form.historySummary}
              onChange={(e) => setForm({ ...form, historySummary: e.target.value })}
            />
          </label>
          <label className="block space-y-1 text-sm sm:col-span-2">
            <span className="text-[var(--text-secondary)]">
              Condutas / exames solicitados (opcional)
            </span>
            <textarea
              className={fieldClass}
              rows={2}
              value={form.requestedActions}
              onChange={(e) => setForm({ ...form, requestedActions: e.target.value })}
            />
          </label>
        </div>

        <Button onClick={() => void submitReferral()} disabled={busy} aria-busy={busy}>
          Emitir encaminhamento
        </Button>
      </div>
    </div>
  );
}
