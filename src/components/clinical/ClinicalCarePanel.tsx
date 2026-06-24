"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import StatusBadge from "@/components/ui/StatusBadge";
import SectionHeader from "@/components/ui/SectionHeader";

const fieldClass =
  "w-full rounded-[var(--radius-button)] border border-[var(--border-muted)] bg-[var(--surface-card)] px-3 py-2 text-[var(--text-primary)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)]";

type Medication = {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  route: string | null;
  status: string;
  statusLabel: string;
  notes: string | null;
};

type ExamOrder = {
  id: string;
  examName: string;
  status: string;
  statusLabel: string;
  clinicalIndication: string | null;
  resultSummary: string | null;
  scheduledAtLabel: string | null;
};

type ProtocolEnrollment = {
  id: string;
  templateName: string;
  status: string;
  statusLabel: string;
  checklist: { id: string; label: string; required?: boolean }[];
  checklistState: Record<string, boolean>;
  progressPercent: number;
  nextReviewAtLabel: string | null;
};

type ProtocolTemplate = {
  id: string;
  name: string;
  specialty: string | null;
};

type ClinicalProfile = {
  allergies: { substance: string; severity?: string; notes?: string }[];
  chronicConditions: { condition: string; since?: string; notes?: string }[];
  bloodType?: string | null;
};

type Vaccine = {
  id: string;
  vaccineName: string;
  doseLabel: string | null;
  status: string;
  statusLabel: string;
  appliedAtLabel: string | null;
  nextDueAtLabel: string | null;
  batchNumber: string | null;
  notes: string | null;
};

type Procedure = { id: string; name: string; category: string };

type CareTab = "medicacao" | "exames" | "protocolos" | "perfil" | "vacinas";

type Props = {
  patientId: string;
  petId?: string;
  subjectType?: "patient" | "pet";
  appointmentId?: string;
  procedures?: Procedure[];
  tab: CareTab;
  onChanged?: () => void;
};

export default function ClinicalCarePanel({
  patientId,
  petId,
  subjectType = petId ? "pet" : "patient",
  appointmentId,
  procedures = [],
  tab,
  onChanged,
}: Props) {
  const apiBase =
    subjectType === "pet" && petId
      ? `/api/prestador/pets/${petId}`
      : `/api/prestador/patients/${patientId}`;
  const isPet = subjectType === "pet" && Boolean(petId);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [examOrders, setExamOrders] = useState<ExamOrder[]>([]);
  const [enrollments, setEnrollments] = useState<ProtocolEnrollment[]>([]);
  const [templates, setTemplates] = useState<ProtocolTemplate[]>([]);
  const [profile, setProfile] = useState<ClinicalProfile | null>(null);
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [medForm, setMedForm] = useState({
    medication: "",
    dosage: "",
    frequency: "",
    route: "",
    durationDays: "",
    notes: "",
  });
  const [examForm, setExamForm] = useState({
    procedureId: "",
    examName: "",
    clinicalIndication: "",
  });
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [allergyInput, setAllergyInput] = useState({ substance: "", severity: "" });
  const [conditionInput, setConditionInput] = useState("");
  const [vaccineForm, setVaccineForm] = useState({
    vaccineName: "",
    doseLabel: "",
    nextDueAt: "",
    batchNumber: "",
    notes: "",
  });

  const loadMedications = useCallback(async () => {
    const res = await fetch(`${apiBase}/medications`);
    const data = await res.json();
    if (res.ok) setMedications(data.medications);
  }, [apiBase]);

  const loadExams = useCallback(async () => {
    const url = appointmentId
      ? `${apiBase}/exam-orders?appointmentId=${appointmentId}`
      : `${apiBase}/exam-orders`;
    const res = await fetch(url);
    const data = await res.json();
    if (res.ok) setExamOrders(data.examOrders);
  }, [apiBase, appointmentId]);

  const loadProtocols = useCallback(async () => {
    const res = await fetch(`/api/prestador/patients/${patientId}/protocols`);
    const data = await res.json();
    if (res.ok) {
      setEnrollments(data.enrollments);
      setTemplates(data.templates);
    }
  }, [patientId]);

  const loadProfile = useCallback(async () => {
    const res = await fetch(`${apiBase}/clinical-profile`);
    const data = await res.json();
    if (res.ok) {
      const loaded = data.profile as ClinicalProfile & { bloodType?: string | null };
      setProfile({
        allergies: loaded.allergies ?? [],
        chronicConditions: loaded.chronicConditions ?? [],
        bloodType: loaded.bloodType ?? null,
      });
    }
  }, [apiBase]);

  const loadVaccines = useCallback(async () => {
    if (!isPet || !petId) return;
    const res = await fetch(`${apiBase}/vaccines`);
    const data = await res.json();
    if (res.ok) setVaccines(data.vaccines);
  }, [apiBase, isPet, petId]);

  useEffect(() => {
    let active = true;
    (async () => {
      if (tab === "medicacao") await loadMedications();
      if (tab === "exames") await loadExams();
      if (tab === "protocolos") await loadProtocols();
      if (tab === "perfil") await loadProfile();
      if (tab === "vacinas") await loadVaccines();
      if (!active) return;
    })();
    return () => {
      active = false;
    };
  }, [tab, loadMedications, loadExams, loadProtocols, loadProfile, loadVaccines]);

  async function addMedication() {
    setBusy(true);
    setMsg(null);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/medications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId,
          ...medForm,
          durationDays: medForm.durationDays ? Number(medForm.durationDays) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao prescrever");
        return;
      }
      setMedForm({ medication: "", dosage: "", frequency: "", route: "", durationDays: "", notes: "" });
      setMsg("Medicação prescrita.");
      await loadMedications();
      onChanged?.();
    } finally {
      setBusy(false);
    }
  }

  async function updateMedStatus(id: string, status: string) {
    setBusy(true);
    try {
      await fetch(`/api/prestador/medications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await loadMedications();
      onChanged?.();
    } finally {
      setBusy(false);
    }
  }

  async function addExamOrder() {
    setBusy(true);
    setMsg(null);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/exam-orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId, ...examForm }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao solicitar exame");
        return;
      }
      setExamForm({ procedureId: "", examName: "", clinicalIndication: "" });
      setMsg("Exame solicitado.");
      await loadExams();
      onChanged?.();
    } finally {
      setBusy(false);
    }
  }

  async function updateExam(id: string, patch: Record<string, unknown>) {
    setBusy(true);
    try {
      await fetch(`/api/prestador/exam-orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      await loadExams();
      onChanged?.();
    } finally {
      setBusy(false);
    }
  }

  async function enrollProtocol() {
    if (!selectedTemplate) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/prestador/patients/${patientId}/protocols`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: selectedTemplate, appointmentId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao iniciar protocolo");
        return;
      }
      setSelectedTemplate("");
      setMsg("Protocolo iniciado.");
      await loadProtocols();
      onChanged?.();
    } finally {
      setBusy(false);
    }
  }

  async function toggleChecklist(enrollment: ProtocolEnrollment, itemId: string) {
    const next = {
      ...enrollment.checklistState,
      [itemId]: !enrollment.checklistState[itemId],
    };
    setBusy(true);
    try {
      await fetch(`/api/prestador/protocols/${enrollment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checklistState: next }),
      });
      await loadProtocols();
      onChanged?.();
    } finally {
      setBusy(false);
    }
  }

  async function saveProfile(next: ClinicalProfile) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`${apiBase}/clinical-profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (res.ok) {
        setProfile(next);
        setMsg("Perfil clínico atualizado.");
        onChanged?.();
      }
    } finally {
      setBusy(false);
    }
  }

  async function addVaccine() {
    if (!isPet) return;
    setBusy(true);
    setMsg(null);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/vaccines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId,
          vaccineName: vaccineForm.vaccineName,
          doseLabel: vaccineForm.doseLabel || undefined,
          nextDueAt: vaccineForm.nextDueAt || undefined,
          batchNumber: vaccineForm.batchNumber || undefined,
          notes: vaccineForm.notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao registrar vacina");
        return;
      }
      setVaccineForm({ vaccineName: "", doseLabel: "", nextDueAt: "", batchNumber: "", notes: "" });
      setMsg("Vacina registrada.");
      await loadVaccines();
      onChanged?.();
    } finally {
      setBusy(false);
    }
  }

  if (tab === "medicacao") {
    return (
      <div className="space-y-4">
        <SectionHeader
          title="Gestão de medicação"
          description={isPet ? "Prescrições estruturadas do pet." : "Prescrições estruturadas do paciente."}
        />
        {msg && <Alert tone="success">{msg}</Alert>}
        {error && <Alert tone="danger">{error}</Alert>}
        <div className="grid gap-2 sm:grid-cols-2">
          <input className={fieldClass} placeholder="Medicamento" value={medForm.medication} onChange={(e) => setMedForm({ ...medForm, medication: e.target.value })} />
          <input className={fieldClass} placeholder="Dose (ex: 1 comprimido)" value={medForm.dosage} onChange={(e) => setMedForm({ ...medForm, dosage: e.target.value })} />
          <input className={fieldClass} placeholder="Frequência (ex: 12/12h)" value={medForm.frequency} onChange={(e) => setMedForm({ ...medForm, frequency: e.target.value })} />
          <input className={fieldClass} placeholder="Via (opcional)" value={medForm.route} onChange={(e) => setMedForm({ ...medForm, route: e.target.value })} />
          <input className={fieldClass} placeholder="Duração (dias)" type="number" value={medForm.durationDays} onChange={(e) => setMedForm({ ...medForm, durationDays: e.target.value })} />
          <input className={fieldClass} placeholder="Observações" value={medForm.notes} onChange={(e) => setMedForm({ ...medForm, notes: e.target.value })} />
        </div>
        <Button onClick={addMedication} disabled={busy}>Prescrever</Button>
        <ul className="divide-y divide-[var(--border-default)]">
          {medications.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div>
                <p className="font-medium">{m.medication}</p>
                <p className="text-sm text-[var(--text-muted)]">{m.dosage} · {m.frequency}{m.route ? ` · ${m.route}` : ""}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge value={m.status} label={m.statusLabel} />
                {m.status === "ATIVA" && (
                  <>
                    <Button size="sm" variant="secondary" disabled={busy} onClick={() => updateMedStatus(m.id, "SUSPENSA")}>Suspender</Button>
                    <Button size="sm" variant="secondary" disabled={busy} onClick={() => updateMedStatus(m.id, "ENCERRADA")}>Encerrar</Button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (tab === "exames") {
    const examProcedures = procedures.filter((p) => p.category === "EXAME");
    return (
      <div className="space-y-4">
        <SectionHeader title="Pedidos de exame" description="Solicitação, acompanhamento e laudo." />
        {msg && <Alert tone="success">{msg}</Alert>}
        {error && <Alert tone="danger">{error}</Alert>}
        <div className="grid gap-2 sm:grid-cols-2">
          <select className={fieldClass} value={examForm.procedureId} onChange={(e) => setExamForm({ ...examForm, procedureId: e.target.value })}>
            <option value="">Catálogo (opcional)</option>
            {examProcedures.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <input className={fieldClass} placeholder="Nome do exame" value={examForm.examName} onChange={(e) => setExamForm({ ...examForm, examName: e.target.value })} />
          <input className={`sm:col-span-2 ${fieldClass}`} placeholder="Indicação clínica" value={examForm.clinicalIndication} onChange={(e) => setExamForm({ ...examForm, clinicalIndication: e.target.value })} />
        </div>
        <Button onClick={addExamOrder} disabled={busy}>Solicitar exame</Button>
        <ul className="space-y-3">
          {examOrders.map((e) => (
            <li key={e.id} className="rounded-[var(--radius-button)] border border-[var(--border-default)] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{e.examName}</p>
                <StatusBadge value={e.status} label={e.statusLabel} />
              </div>
              {e.clinicalIndication && <p className="mt-1 text-sm text-[var(--text-muted)]">{e.clinicalIndication}</p>}
              {e.resultSummary && <p className="mt-2 text-sm text-[var(--text-secondary)]">Laudo: {e.resultSummary}</p>}
              <div className="mt-2 flex flex-wrap gap-2">
                {e.status === "SOLICITADO" && (
                  <Button size="sm" variant="secondary" disabled={busy} onClick={() => updateExam(e.id, { status: "AGENDADO", scheduledAt: new Date().toISOString() })}>Agendar</Button>
                )}
                {e.status === "AGENDADO" && (
                  <Button size="sm" variant="secondary" disabled={busy} onClick={() => updateExam(e.id, { status: "REALIZADO" })}>Marcar realizado</Button>
                )}
                {e.status === "REALIZADO" && (
                  <Button size="sm" variant="secondary" disabled={busy} onClick={() => {
                    const summary = prompt("Resumo do laudo:");
                    if (summary) updateExam(e.id, { status: "LAUDADO", resultSummary: summary, markReviewed: true });
                  }}>Registrar laudo</Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (tab === "protocolos") {
    if (isPet) {
      return (
        <p className="text-sm text-[var(--text-muted)]">
          Protocolos de cuidado permanecem vinculados ao tutor. Use o histórico do tutor para protocolos compartilhados.
        </p>
      );
    }
    return (
      <div className="space-y-4">
        <SectionHeader title="Protocolos de cuidado" description="Checklists e acompanhamento programado." />
        {msg && <Alert tone="success">{msg}</Alert>}
        {error && <Alert tone="danger">{error}</Alert>}
        <div className="flex flex-col gap-2 sm:flex-row">
          <select className={`flex-1 ${fieldClass}`} value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)}>
            <option value="">Selecione um protocolo...</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}{t.specialty ? ` (${t.specialty})` : ""}</option>
            ))}
          </select>
          <Button onClick={enrollProtocol} disabled={busy || !selectedTemplate}>Iniciar protocolo</Button>
        </div>
        <ul className="space-y-4">
          {enrollments.map((en) => (
            <li key={en.id} className="rounded-[var(--radius-button)] border border-[var(--border-default)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{en.templateName}</p>
                  {en.nextReviewAtLabel && <p className="text-xs text-[var(--text-muted)]">Próxima revisão: {en.nextReviewAtLabel}</p>}
                </div>
                <StatusBadge value={en.status} label={en.statusLabel} />
              </div>
              <p className="mt-2 text-xs text-[var(--text-muted)]">Progresso: {en.progressPercent}%</p>
              <ul className="mt-3 space-y-2">
                {en.checklist.map((item) => (
                  <li key={item.id}>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={Boolean(en.checklistState[item.id])}
                        disabled={busy || en.status !== "ATIVO"}
                        onChange={() => toggleChecklist(en, item.id)}
                      />
                      {item.label}
                      {item.required && <span className="text-xs text-[var(--text-muted)]">(obrigatório)</span>}
                    </label>
                  </li>
                ))}
              </ul>
              {en.status === "ATIVO" && en.progressPercent === 100 && (
                <Button className="mt-3" size="sm" variant="secondary" disabled={busy} onClick={async () => {
                  await fetch(`/api/prestador/protocols/${en.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: "CONCLUIDO" }),
                  });
                  await loadProtocols();
                  onChanged?.();
                }}>Concluir protocolo</Button>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (tab === "vacinas") {
    if (!isPet) {
      return <p className="text-sm text-[var(--text-muted)]">Carteira vacinal disponível apenas para pets (nicho VET).</p>;
    }
    return (
      <div className="space-y-4">
        <SectionHeader title="Carteira vacinal" description="Registro de vacinas aplicadas e próximos reforços." />
        {msg && <Alert tone="success">{msg}</Alert>}
        {error && <Alert tone="danger">{error}</Alert>}
        <div className="grid gap-2 sm:grid-cols-2">
          <input className={fieldClass} placeholder="Vacina (ex: V10, Antirrábica)" value={vaccineForm.vaccineName} onChange={(e) => setVaccineForm({ ...vaccineForm, vaccineName: e.target.value })} />
          <input className={fieldClass} placeholder="Dose (ex: reforço anual)" value={vaccineForm.doseLabel} onChange={(e) => setVaccineForm({ ...vaccineForm, doseLabel: e.target.value })} />
          <input className={fieldClass} type="date" placeholder="Próximo reforço" value={vaccineForm.nextDueAt} onChange={(e) => setVaccineForm({ ...vaccineForm, nextDueAt: e.target.value })} />
          <input className={fieldClass} placeholder="Lote" value={vaccineForm.batchNumber} onChange={(e) => setVaccineForm({ ...vaccineForm, batchNumber: e.target.value })} />
          <input className={`sm:col-span-2 ${fieldClass}`} placeholder="Observações" value={vaccineForm.notes} onChange={(e) => setVaccineForm({ ...vaccineForm, notes: e.target.value })} />
        </div>
        <Button onClick={addVaccine} disabled={busy}>Registrar vacina</Button>
        <ul className="space-y-3">
          {vaccines.map((v) => (
            <li key={v.id} className="rounded-[var(--radius-button)] border border-[var(--border-default)] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{v.vaccineName}{v.doseLabel ? ` — ${v.doseLabel}` : ""}</p>
                <StatusBadge value={v.status} label={v.statusLabel} />
              </div>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                {v.appliedAtLabel ? `Aplicada em ${v.appliedAtLabel}` : "Pendente"}
                {v.nextDueAtLabel ? ` · Próximo reforço: ${v.nextDueAtLabel}` : ""}
              </p>
              {v.batchNumber && <p className="text-xs text-[var(--text-muted)]">Lote: {v.batchNumber}</p>}
              {v.notes && <p className="mt-1 text-sm text-[var(--text-secondary)]">{v.notes}</p>}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // perfil
  if (!profile) return <p className="text-sm text-[var(--text-muted)]">Carregando perfil...</p>;

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Perfil clínico"
        description={isPet ? "Alergias e condições persistentes do pet." : "Alergias e condições persistentes do paciente."}
      />
      {msg && <Alert tone="success">{msg}</Alert>}
      {!isPet && (
        <input
          className={fieldClass}
          placeholder="Tipo sanguíneo"
          value={profile.bloodType ?? ""}
          onChange={(e) => setProfile({ ...profile, bloodType: e.target.value || null })}
        />
      )}
      <div className="flex flex-wrap gap-2">
        <input className={`flex-1 ${fieldClass}`} placeholder="Alergia" value={allergyInput.substance} onChange={(e) => setAllergyInput({ ...allergyInput, substance: e.target.value })} />
        <input className={`w-32 ${fieldClass}`} placeholder="Gravidade" value={allergyInput.severity} onChange={(e) => setAllergyInput({ ...allergyInput, severity: e.target.value })} />
        <Button variant="secondary" onClick={() => {
          if (!allergyInput.substance.trim()) return;
          const next = { ...profile, allergies: [...profile.allergies, { substance: allergyInput.substance.trim(), severity: allergyInput.severity || undefined }] };
          setProfile(next);
          setAllergyInput({ substance: "", severity: "" });
        }}>Adicionar alergia</Button>
      </div>
      <ul className="text-sm">
        {profile.allergies.map((a, i) => (
          <li key={`${a.substance}-${i}`} className="flex justify-between py-1">
            <span>{a.substance}{a.severity ? ` (${a.severity})` : ""}</span>
            <button type="button" className="text-xs text-red-600" onClick={() => setProfile({ ...profile, allergies: profile.allergies.filter((_, idx) => idx !== i) })}>Remover</button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input className={`flex-1 ${fieldClass}`} placeholder="Condição crônica" value={conditionInput} onChange={(e) => setConditionInput(e.target.value)} />
        <Button variant="secondary" onClick={() => {
          if (!conditionInput.trim()) return;
          setProfile({ ...profile, chronicConditions: [...profile.chronicConditions, { condition: conditionInput.trim() }] });
          setConditionInput("");
        }}>Adicionar</Button>
      </div>
      <ul className="text-sm">
        {profile.chronicConditions.map((c, i) => (
          <li key={`${c.condition}-${i}`}>{c.condition}</li>
        ))}
      </ul>
      <Button onClick={() => saveProfile(profile)} disabled={busy}>Salvar perfil clínico</Button>
    </div>
  );
}
