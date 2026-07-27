"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import StatusBadge from "@/components/ui/StatusBadge";
import SectionHeader from "@/components/ui/SectionHeader";
import ExportButtons from "@/components/ExportButtons";
import { REFERRAL_TEMPLATES, type ReferralTemplate } from "@/lib/clinical/encaminhamento";
import { useLabels } from "@/hooks/useLabels";

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
  const [documents, setDocuments] = useState<DischargeDocument[]>([]);
  const [templates, setTemplates] = useState<ReferralTemplate[]>(REFERRAL_TEMPLATES);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    referralKind: "ESPECIALIDADE",
    specialty: "",
    urgency: "ROTINA",
    clinicalReason: "",
    historySummary: "",
    requestedActions: "",
  });

  const loadDocuments = useCallback(async () => {
    const params = new URLSearchParams();
    if (appointmentId) params.set("appointmentId", appointmentId);
    if (petId) params.set("petId", petId);
    const qs = params.toString() ? `?${params}` : "";
    const res = await fetch(
      `/api/prestador/patients/${patientId}/discharge-documents${qs}`,
    );
    const data = await res.json();
    if (res.ok) {
      setDocuments(data.documents ?? []);
      if (Array.isArray(data.referralTemplates) && data.referralTemplates.length > 0) {
        setTemplates(data.referralTemplates);
      }
    }
  }, [patientId, appointmentId, petId]);

  useEffect(() => {
    let active = true;
    (async () => {
      const params = new URLSearchParams();
      if (appointmentId) params.set("appointmentId", appointmentId);
      if (petId) params.set("petId", petId);
      const qs = params.toString() ? `?${params}` : "";
      const res = await fetch(
        `/api/prestador/patients/${patientId}/discharge-documents${qs}`,
      );
      if (!active) return;
      const data = await res.json();
      if (!active || !res.ok) return;
      setDocuments(data.documents ?? []);
      if (Array.isArray(data.referralTemplates) && data.referralTemplates.length > 0) {
        setTemplates(data.referralTemplates);
      }
    })();
    return () => {
      active = false;
    };
  }, [patientId, appointmentId, petId]);

  function applyTemplate(template: ReferralTemplate) {
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
      setMsg("Encaminhamento emitido. Imprima a guia e entregue em mãos ou oriente o acesso no painel.");
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

  async function cancelReferral(id: string) {
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
        description={`Receitas, pedidos de exame e encaminhamentos para entregar ao ${labels.patient.toLowerCase()} (impresso ou no painel).`}
      />

      {msg && <Alert tone="success">{msg}</Alert>}
      {error && <Alert tone="danger">{error}</Alert>}

      {appointmentId && documents.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-button)] border border-[var(--border-default)] bg-[var(--surface-muted)] p-3">
          <p className="text-sm text-[var(--text-secondary)]">
            {documents.length} guia(s) deste atendimento — imprimir pacote completo
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
          />
        </div>
      )}

      <div className="space-y-3">
        <p className="text-sm font-medium text-[var(--text-secondary)]">Guias emitidas</p>
        {documents.length === 0 ? (
          <p className="rounded-[var(--radius-button)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--text-muted)]">
            Nenhuma guia ainda. Emita receita (aba Medicação), solicite exames (aba Exames) ou
            crie um encaminhamento abaixo.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--border-default)] rounded-[var(--radius-button)] border border-[var(--border-muted)]">
            {documents.map((doc) => (
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
                  />
                  {doc.kind === "ENCAMINHAMENTO" && doc.status === "ATIVO" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busy}
                      onClick={() => void cancelReferral(doc.exportParams.id)}
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

        <div className="flex flex-wrap gap-2">
          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => applyTemplate(template)}
              className="rounded-full border border-[var(--border-muted)] px-3 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
            >
              {template.label}
            </button>
          ))}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <select
            className={fieldClass}
            value={form.referralKind}
            onChange={(e) => setForm({ ...form, referralKind: e.target.value })}
            aria-label="Tipo de encaminhamento"
          >
            <option value="ESPECIALIDADE">Para especialidade</option>
            <option value="RETORNO">Retorno</option>
            <option value="SERVICO">Para serviço</option>
          </select>
          <select
            className={fieldClass}
            value={form.urgency}
            onChange={(e) => setForm({ ...form, urgency: e.target.value })}
            aria-label="Urgência"
          >
            <option value="ROTINA">Rotina</option>
            <option value="BREVE">Breve</option>
            <option value="URGENTE">Urgente</option>
          </select>
          <input
            className={`sm:col-span-2 ${fieldClass}`}
            placeholder="Especialidade / serviço de destino"
            value={form.specialty}
            onChange={(e) => setForm({ ...form, specialty: e.target.value })}
          />
          <textarea
            className={`sm:col-span-2 ${fieldClass}`}
            rows={3}
            placeholder="Motivo clínico"
            value={form.clinicalReason}
            onChange={(e) => setForm({ ...form, clinicalReason: e.target.value })}
          />
          <textarea
            className={`sm:col-span-2 ${fieldClass}`}
            rows={2}
            placeholder="Histórico relevante (opcional)"
            value={form.historySummary}
            onChange={(e) => setForm({ ...form, historySummary: e.target.value })}
          />
          <textarea
            className={`sm:col-span-2 ${fieldClass}`}
            rows={2}
            placeholder="Condutas / exames solicitados ao especialista (opcional)"
            value={form.requestedActions}
            onChange={(e) => setForm({ ...form, requestedActions: e.target.value })}
          />
        </div>

        <Button onClick={() => void submitReferral()} disabled={busy}>
          Emitir encaminhamento
        </Button>
      </div>
    </div>
  );
}
