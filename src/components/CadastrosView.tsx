"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ViewStateBoundary from "@/components/ui/ViewStateBoundary";
import SectionHeader from "@/components/ui/SectionHeader";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";
import CrudOperationsMap from "@/components/CrudOperationsMap";
import FlowImprovementsMap from "@/components/FlowImprovementsMap";
import CadastrosPricingTab from "@/components/cadastros/CadastrosPricingTab";
import TabBar from "@/components/ui/TabBar";
import {
  CompanyExtraFields,
  CompanyStatusSelect,
  PatientExtraFields,
  UserProfessionalFields,
  emptyCompanyExtra,
  emptyPatientExtra,
  emptyUserProfessional,
} from "@/components/cadastros/CadastroExtraFields";
import ProtocolTemplatesPanel from "@/components/ProtocolTemplatesPanel";
import CadastrosPetsTab from "@/components/cadastros/CadastrosPetsTab";
import ImportInterchangePanel from "@/components/cadastros/ImportInterchangePanel";
import { useLabels } from "@/hooks/useLabels";
import { useFormUndo } from "@/hooks/useFormUndo";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { fetchJson } from "@/lib/ui/api-feedback";
import { confirmPresets } from "@/lib/ui/confirm-presets";
import { buildCadastrosTabs } from "@/lib/navigation/niche-nav";

type Tab = "patients" | "pets" | "companies" | "procedures" | "pricing" | "protocols" | "users" | "operations";

const fieldClass =
  "mt-1 w-full rounded-[var(--radius-button)] border border-[var(--border-muted)] bg-[var(--surface-card)] px-3 py-2 text-sm";

type PatientRow = {
  id: string;
  name: string;
  cpf: string;
  birthDate: string;
  birthDateLabel: string;
  phone: string | null;
  email: string | null;
  gender: string | null;
  motherName: string | null;
  employeeId: string | null;
  bondType: string | null;
  companyId: string | null;
  companyName: string | null;
};

type CompanyRow = {
  id: string;
  name: string;
  cnpj: string;
  tradeName: string | null;
  email: string | null;
  phone: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  addressStreet: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressZip: string | null;
  status: string;
  statusLabel: string;
  contractActive: boolean;
};

type ProcedureRow = {
  id: string;
  code: string;
  name: string;
  category: string;
  basePrice: number;
  basePriceLabel: string;
};

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  internoProfile: string | null;
  companyId: string | null;
  patientId: string | null;
  phone: string | null;
  councilType: string | null;
  councilNumber: string | null;
  councilUf: string | null;
  specialty: string | null;
};

type CadastrosPayload = {
  patients: PatientRow[];
  companies: CompanyRow[];
  procedures: ProcedureRow[];
  users: UserRow[];
};

export default function CadastrosView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { labels, niche } = useLabels();
  const tabs = useMemo(() => buildCadastrosTabs(labels, niche), [labels, niche]);
  const tabFromUrl = searchParams.get("tab");
  const tab: Tab =
    tabFromUrl && tabs.some((t) => t.key === tabFromUrl) ? (tabFromUrl as Tab) : "patients";

  const { isBusy, run, showToast } = useAsyncAction();

  const [patientForm, setPatientForm] = useState({
    name: "",
    cpf: "",
    birthDate: "",
    phone: "",
    companyId: "",
    ...emptyPatientExtra(),
  });
  const [companyForm, setCompanyForm] = useState({
    name: "",
    cnpj: "",
    status: "ATIVO",
    ...emptyCompanyExtra(),
  });
  const [procForm, setProcForm] = useState({
    code: "",
    name: "",
    category: "CONSULTA",
    basePrice: "150",
  });
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "bibi123",
    role: "PRESTADOR",
    internoProfile: "",
    companyId: "",
    patientId: "",
    ...emptyUserProfessional(),
  });

  const [editingPatient, setEditingPatient] = useState<PatientRow | null>(null);
  const [editingCompany, setEditingCompany] = useState<CompanyRow | null>(null);
  const [editingProcedure, setEditingProcedure] = useState<ProcedureRow | null>(null);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [userEditPassword, setUserEditPassword] = useState("");
  const patientEditUndo = useFormUndo<PatientRow | null>(null);

  const loadCadastros = useCallback(async () => {
    const [pRes, cRes, prRes, uRes] = await Promise.all([
      fetchJson<{ patients?: PatientRow[] }>(
        "/api/interno/patients",
        undefined,
        "Erro ao carregar beneficiários",
      ),
      fetchJson<{ companies?: CompanyRow[] }>(
        "/api/interno/companies",
        undefined,
        "Erro ao carregar empresas",
      ),
      fetchJson<{ procedures?: ProcedureRow[] }>(
        "/api/interno/procedures",
        undefined,
        "Erro ao carregar procedimentos",
      ),
      fetchJson<{ users?: UserRow[] }>(
        "/api/interno/users",
        undefined,
        "Erro ao carregar usuários",
      ),
    ]);
    if (!pRes.ok) return pRes;
    if (!cRes.ok) return cRes;
    if (!prRes.ok) return prRes;
    if (!uRes.ok) return uRes;
    return {
      ok: true as const,
      data: {
        patients: pRes.data.patients ?? [],
        companies: cRes.data.companies ?? [],
        procedures: prRes.data.procedures ?? [],
        users: uRes.data.users ?? [],
      },
      status: 200,
    };
  }, []);

  const { data, loading, error, reload } = useAsyncData<CadastrosPayload>(loadCadastros, [], {
    forbiddenMessage: "Sem permissão para acessar cadastros",
  });

  const patients = data?.patients ?? [];
  const companies = data?.companies ?? [];
  const procedures = data?.procedures ?? [];
  const users = data?.users ?? [];

  const selectTab = useCallback(
    (next: Tab) => {
      router.replace(`/interno/cadastros?tab=${next}`, { scroll: false });
    },
    [router],
  );

  async function submitPatient(e: React.FormEvent) {
    e.preventDefault();
    await run(
      "patient",
      () =>
        fetch("/api/interno/patients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...patientForm,
            companyId: patientForm.companyId || null,
          }),
        }),
      {
        silentSuccess: true,
        onSuccess: async (body) => {
          const patient = body.patient as { name: string };
          showToast({ message: `Beneficiário ${patient.name} cadastrado`, tone: "success" });
          setPatientForm({
            name: "",
            cpf: "",
            birthDate: "",
            phone: "",
            companyId: "",
            ...emptyPatientExtra(),
          });
          await reload();
        },
      },
    );
  }

  async function savePatientEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPatient) return;
    const patientId = editingPatient.id;
    await run(
      `edit-patient-${patientId}`,
      () =>
        fetch(`/api/interno/patients/${patientId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editingPatient.name,
            cpf: editingPatient.cpf,
            birthDate: editingPatient.birthDate,
            phone: editingPatient.phone,
            email: editingPatient.email,
            gender: editingPatient.gender,
            motherName: editingPatient.motherName,
            employeeId: editingPatient.employeeId,
            bondType: editingPatient.bondType,
            companyId: editingPatient.companyId,
          }),
        }),
      {
        silentSuccess: true,
        onSuccess: async (body) => {
          const patient = body.patient as { id: string; name: string };
          setEditingPatient(null);
          patientEditUndo.reset(null);
          await reload();
          showToast({
            message: `${patient.name} atualizado`,
            actionLabel: "Desfazer",
            tone: "success",
            onAction: async () => {
              const revertRes = await fetch("/api/interno/change/revert-recent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ entityType: "Patient", entityId: patient.id }),
              });
              if (revertRes.ok) {
                await reload();
                showToast({ message: "Alteração desfeita", tone: "info" });
              }
            },
          });
        },
      },
    );
  }

  async function submitCompany(e: React.FormEvent) {
    e.preventDefault();
    await run(
      "company",
      () =>
        fetch("/api/interno/companies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(companyForm),
        }),
      {
        silentSuccess: true,
        onSuccess: async (body) => {
          const company = body.company as { name: string };
          showToast({ message: `Empresa ${company.name} cadastrada`, tone: "success" });
          setCompanyForm({ name: "", cnpj: "", status: "ATIVO", ...emptyCompanyExtra() });
          await reload();
        },
      },
    );
  }

  async function saveCompanyEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCompany) return;
    const companyId = editingCompany.id;
    const original = companies.find((c) => c.id === companyId);
    const statusChanged = Boolean(original && original.status !== editingCompany.status);

    await run(
      `edit-company-${companyId}`,
      () =>
        fetch(`/api/interno/companies/${companyId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editingCompany.name,
            cnpj: editingCompany.cnpj,
            tradeName: editingCompany.tradeName,
            email: editingCompany.email,
            phone: editingCompany.phone,
            contactName: editingCompany.contactName,
            contactEmail: editingCompany.contactEmail,
            contactPhone: editingCompany.contactPhone,
            addressStreet: editingCompany.addressStreet,
            addressCity: editingCompany.addressCity,
            addressState: editingCompany.addressState,
            addressZip: editingCompany.addressZip,
          }),
        }),
      {
        silentSuccess: true,
        onSuccess: async (body) => {
          const company = body.company as { name: string };
          if (statusChanged) {
            const statusRes = await fetch(`/api/interno/companies/${companyId}/status`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: editingCompany.status }),
            });
            const statusData = await statusRes.json();
            if (!statusRes.ok) {
              showToast({
                message: statusData.error ?? "Dados salvos, mas falha ao atualizar status CRM",
                tone: "info",
              });
              setEditingCompany(null);
              await reload();
              return;
            }
          }
          showToast({ message: `Empresa ${company.name} atualizada`, tone: "success" });
          setEditingCompany(null);
          await reload();
        },
      },
    );
  }

  async function submitProcedure(e: React.FormEvent) {
    e.preventDefault();
    await run(
      "procedure",
      () =>
        fetch("/api/interno/procedures", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...procForm,
            basePrice: Number(procForm.basePrice),
          }),
        }),
      {
        silentSuccess: true,
        onSuccess: async (body) => {
          const procedure = body.procedure as { code: string };
          showToast({ message: `Procedimento ${procedure.code} cadastrado`, tone: "success" });
          setProcForm({ code: "", name: "", category: "CONSULTA", basePrice: "150" });
          await reload();
        },
      },
    );
  }

  async function saveProcedureEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingProcedure) return;
    const procId = editingProcedure.id;
    await run(
      `edit-proc-${procId}`,
      () =>
        fetch(`/api/interno/procedures/${procId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: editingProcedure.code,
            name: editingProcedure.name,
            category: editingProcedure.category,
            basePrice: editingProcedure.basePrice,
          }),
        }),
      {
        silentSuccess: true,
        onSuccess: async (body) => {
          const procedure = body.procedure as { code: string };
          showToast({ message: `Procedimento ${procedure.code} atualizado`, tone: "success" });
          setEditingProcedure(null);
          await reload();
        },
      },
    );
  }

  async function submitUser(e: React.FormEvent) {
    e.preventDefault();
    await run(
      "user",
      () =>
        fetch("/api/interno/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...userForm,
            companyId: userForm.companyId || null,
            patientId: userForm.patientId || null,
            internoProfile: userForm.role === "INTERNO" ? userForm.internoProfile || null : null,
          }),
        }),
      {
        silentSuccess: true,
        onSuccess: async (body) => {
          const user = body.user as { name: string };
          showToast({ message: `Usuário ${user.name} criado`, tone: "success" });
          setUserForm({
            name: "",
            email: "",
            password: "bibi123",
            role: "PRESTADOR",
            internoProfile: "",
            companyId: "",
            patientId: "",
            ...emptyUserProfessional(),
          });
          await reload();
        },
      },
    );
  }

  async function saveUserEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    const userId = editingUser.id;
    const body: Record<string, unknown> = {
      name: editingUser.name,
      email: editingUser.email,
      role: editingUser.role,
      companyId: editingUser.companyId,
      patientId: editingUser.patientId,
      phone: editingUser.phone,
      councilType: editingUser.councilType,
      councilNumber: editingUser.councilNumber,
      councilUf: editingUser.councilUf,
      specialty: editingUser.specialty,
    };
    if (userEditPassword) body.password = userEditPassword;
    if (editingUser.role === "INTERNO") {
      body.internoProfile = editingUser.internoProfile;
    }

    await run(
      `edit-user-${userId}`,
      () =>
        fetch(`/api/interno/users/${userId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
      {
        silentSuccess: true,
        onSuccess: async (bodyRes) => {
          const user = bodyRes.user as { name: string };
          showToast({ message: `Usuário ${user.name} atualizado`, tone: "success" });
          setEditingUser(null);
          setUserEditPassword("");
          await reload();
        },
      },
    );
  }

  async function deleteProcedure(id: string, label: string) {
    await run(
      `del-${id}`,
      () => fetch(`/api/interno/procedures/${id}`, { method: "DELETE" }),
      {
        confirm: confirmPresets.delete(label),
        successMessage: "Procedimento excluído",
        onSuccess: async () => {
          await reload();
        },
      },
    );
  }

  return (
    <ViewStateBoundary
      loading={loading}
      error={error}
      loadingMessage="Carregando cadastros..."
      onRetry={() => void reload()}
    >
      <div className="space-y-6">
      <TabBar
        tabs={tabs.map((t) => ({ key: t.key, label: t.label }))}
        active={tab}
        onSelect={(key) => selectTab(key as Tab)}
      />

      {tab === "patients" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <ImportInterchangePanel
            entity="patients"
            entityLabel={labels.patient}
            onImported={() => void reload()}
          />
          <Card>
            <SectionHeader title="Novo beneficiário" />
            <form onSubmit={submitPatient} className="mt-4 space-y-3">
              <label className="block text-sm">
                <span className="text-[var(--text-secondary)]">Nome</span>
                <input
                  required
                  className={fieldClass}
                  value={patientForm.name}
                  onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                <span className="text-[var(--text-secondary)]">CPF</span>
                <input
                  required
                  className={fieldClass}
                  value={patientForm.cpf}
                  onChange={(e) => setPatientForm({ ...patientForm, cpf: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                <span className="text-[var(--text-secondary)]">Nascimento</span>
                <input
                  required
                  type="date"
                  className={fieldClass}
                  value={patientForm.birthDate}
                  onChange={(e) => setPatientForm({ ...patientForm, birthDate: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                <span className="text-[var(--text-secondary)]">Telefone (opcional)</span>
                <input
                  className={fieldClass}
                  value={patientForm.phone}
                  onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                <span className="text-[var(--text-secondary)]">Empresa (opcional)</span>
                <select
                  className={fieldClass}
                  value={patientForm.companyId}
                  onChange={(e) => setPatientForm({ ...patientForm, companyId: e.target.value })}
                >
                  <option value="">Particular</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <PatientExtraFields
                values={{
                  email: patientForm.email,
                  gender: patientForm.gender,
                  motherName: patientForm.motherName,
                  employeeId: patientForm.employeeId,
                  bondType: patientForm.bondType,
                }}
                onChange={(patch) => setPatientForm({ ...patientForm, ...patch })}
              />
              <Button type="submit" variant="portal" disabled={isBusy("patient")}>
                {isBusy("patient") ? "Salvando..." : "Cadastrar"}
              </Button>
            </form>
          </Card>
          <Card>
            <SectionHeader title="Beneficiários" />
            {patients.length === 0 ? (
              <EmptyState message="Nenhum beneficiário." />
            ) : (
              <ul className="mt-4 divide-y divide-[var(--border-default)]">
                {patients.map((p) => (
                  <li key={p.id} className="py-3 text-sm">
                    {editingPatient?.id === p.id ? (
                      <form onSubmit={savePatientEdit} className="space-y-2 rounded border border-[var(--border-muted)] p-3">
                        <input
                          required
                          className={fieldClass}
                          value={editingPatient.name}
                          onChange={(e) =>
                            setEditingPatient({ ...editingPatient, name: e.target.value })
                          }
                        />
                        <input
                          required
                          className={fieldClass}
                          value={editingPatient.cpf}
                          onChange={(e) =>
                            setEditingPatient({ ...editingPatient, cpf: e.target.value })
                          }
                        />
                        <input
                          required
                          type="date"
                          className={fieldClass}
                          value={editingPatient.birthDate}
                          onChange={(e) =>
                            setEditingPatient({ ...editingPatient, birthDate: e.target.value })
                          }
                        />
                        <input
                          className={fieldClass}
                          placeholder="Telefone"
                          value={editingPatient.phone ?? ""}
                          onChange={(e) =>
                            setEditingPatient({ ...editingPatient, phone: e.target.value || null })
                          }
                        />
                        <select
                          className={fieldClass}
                          value={editingPatient.companyId ?? ""}
                          onChange={(e) =>
                            setEditingPatient({
                              ...editingPatient,
                              companyId: e.target.value || null,
                            })
                          }
                        >
                          <option value="">Particular</option>
                          {companies.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <PatientExtraFields
                          values={{
                            email: editingPatient.email ?? "",
                            gender: editingPatient.gender ?? "",
                            motherName: editingPatient.motherName ?? "",
                            employeeId: editingPatient.employeeId ?? "",
                            bondType: editingPatient.bondType ?? "",
                          }}
                          onChange={(patch) =>
                            setEditingPatient({
                              ...editingPatient,
                              ...patch,
                              email: patch.email ?? editingPatient.email,
                              gender: patch.gender ?? editingPatient.gender,
                              motherName: patch.motherName ?? editingPatient.motherName,
                              employeeId: patch.employeeId ?? editingPatient.employeeId,
                              bondType: patch.bondType ?? editingPatient.bondType,
                            })
                          }
                        />
                        <div className="flex gap-2">
                          <Button
                            type="submit"
                            size="sm"
                            variant="portal"
                            disabled={isBusy(`edit-patient-${p.id}`)}
                          >
                            Salvar
                          </Button>
                          <Button type="button" size="sm" variant="secondary" onClick={() => setEditingPatient(null)}>
                            Cancelar
                          </Button>
                          {patientEditUndo.canUndo && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const restored = patientEditUndo.undo();
                                if (restored) setEditingPatient(restored);
                              }}
                            >
                              Desfazer (Ctrl+Z)
                            </Button>
                          )}
                        </div>
                      </form>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Link
                            href={`/interno/beneficiarios/${p.id}?from=/interno/cadastros`}
                            className="font-medium text-[var(--portal-accent)] hover:underline"
                          >
                            {p.name}
                          </Link>
                          <p className="text-[var(--text-muted)]">
                            {p.cpf} · {p.companyName ?? "Particular"}
                            {p.phone ? ` · ${p.phone}` : ""}
                          </p>
                        </div>
                        <Button type="button" size="sm" variant="ghost" onClick={() => {
                          patientEditUndo.reset({ ...p });
                          setEditingPatient({ ...p });
                        }}>
                          Editar
                        </Button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      {tab === "pets" && <CadastrosPetsTab />}

      {tab === "companies" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <ImportInterchangePanel entity="companies" entityLabel="Empresas PJ" onImported={() => void reload()} />
          <Card>
            <SectionHeader title="Nova empresa" description="Razão social e CNPJ são obrigatórios (padrão mercado B2B)." />
            <form onSubmit={submitCompany} className="mt-4 space-y-3">
              <label className="block text-sm">
                <span className="text-[var(--text-secondary)]">Razão social</span>
                <input
                  required
                  className={fieldClass}
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                <span className="text-[var(--text-secondary)]">CNPJ</span>
                <input
                  required
                  className={fieldClass}
                  value={companyForm.cnpj}
                  onChange={(e) => setCompanyForm({ ...companyForm, cnpj: e.target.value })}
                />
              </label>
              <CompanyExtraFields
                values={{
                  tradeName: companyForm.tradeName,
                  email: companyForm.email,
                  phone: companyForm.phone,
                  contactName: companyForm.contactName,
                  contactEmail: companyForm.contactEmail,
                  contactPhone: companyForm.contactPhone,
                  addressStreet: companyForm.addressStreet,
                  addressCity: companyForm.addressCity,
                  addressState: companyForm.addressState,
                  addressZip: companyForm.addressZip,
                }}
                onChange={(patch) => setCompanyForm({ ...companyForm, ...patch })}
              />
              <Button type="submit" variant="portal" disabled={isBusy("company")}>
                Cadastrar
              </Button>
            </form>
          </Card>
          <Card>
            <SectionHeader title="Empresas" />
            <ul className="mt-4 divide-y divide-[var(--border-default)]">
              {companies.map((c) => (
                <li key={c.id} className="py-3 text-sm">
                  {editingCompany?.id === c.id ? (
                    <form onSubmit={saveCompanyEdit} className="space-y-2 rounded border border-[var(--border-muted)] p-3">
                      <input
                        required
                        className={fieldClass}
                        value={editingCompany.name}
                        onChange={(e) =>
                          setEditingCompany({ ...editingCompany, name: e.target.value })
                        }
                      />
                      <input
                        required
                        className={fieldClass}
                        value={editingCompany.cnpj}
                        onChange={(e) =>
                          setEditingCompany({ ...editingCompany, cnpj: e.target.value })
                        }
                      />
                      <CompanyStatusSelect
                        value={editingCompany.status}
                        onChange={(status) =>
                          setEditingCompany({ ...editingCompany, status })
                        }
                      />
                      <CompanyExtraFields
                        values={{
                          tradeName: editingCompany.tradeName ?? "",
                          email: editingCompany.email ?? "",
                          phone: editingCompany.phone ?? "",
                          contactName: editingCompany.contactName ?? "",
                          contactEmail: editingCompany.contactEmail ?? "",
                          contactPhone: editingCompany.contactPhone ?? "",
                          addressStreet: editingCompany.addressStreet ?? "",
                          addressCity: editingCompany.addressCity ?? "",
                          addressState: editingCompany.addressState ?? "",
                          addressZip: editingCompany.addressZip ?? "",
                        }}
                        onChange={(patch) =>
                          setEditingCompany({
                            ...editingCompany,
                            ...patch,
                          })
                        }
                      />
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editingCompany.contractActive}
                          onChange={(e) =>
                            setEditingCompany({
                              ...editingCompany,
                              contractActive: e.target.checked,
                            })
                          }
                        />
                        <span>Contrato ativo</span>
                      </label>
                      <div className="flex gap-2">
                        <Button type="submit" size="sm" variant="portal" disabled={isBusy(`edit-company-${c.id}`)}>
                          Salvar
                        </Button>
                        <Button type="button" size="sm" variant="secondary" onClick={() => setEditingCompany(null)}>
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex justify-between gap-2">
                      <div>
                        <span className="font-medium">{c.name}</span>
                        <p className="text-[var(--text-muted)]">{c.cnpj}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge value={c.status} map="company" />
                        <Button type="button" size="sm" variant="ghost" onClick={() => setEditingCompany({ ...c })}>
                          Editar
                        </Button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {tab === "procedures" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <ImportInterchangePanel
            entity="procedures"
            entityLabel={labels.procedure}
            onImported={() => void reload()}
          />
          <Card>
            <SectionHeader title="Novo procedimento" />
            <form onSubmit={submitProcedure} className="mt-4 space-y-3">
              <label className="block text-sm">
                <span className="text-[var(--text-secondary)]">Código</span>
                <input
                  required
                  className={fieldClass}
                  value={procForm.code}
                  onChange={(e) => setProcForm({ ...procForm, code: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                <span className="text-[var(--text-secondary)]">Nome</span>
                <input
                  required
                  className={fieldClass}
                  value={procForm.name}
                  onChange={(e) => setProcForm({ ...procForm, name: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                <span className="text-[var(--text-secondary)]">Categoria</span>
                <select
                  className={fieldClass}
                  value={procForm.category}
                  onChange={(e) => setProcForm({ ...procForm, category: e.target.value })}
                >
                  <option value="CONSULTA">Consulta</option>
                  <option value="EXAME">Exame</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="text-[var(--text-secondary)]">Preço (R$)</span>
                <input
                  required
                  type="number"
                  step="0.01"
                  className={fieldClass}
                  value={procForm.basePrice}
                  onChange={(e) => setProcForm({ ...procForm, basePrice: e.target.value })}
                />
              </label>
              <Button type="submit" variant="portal" disabled={isBusy("procedure")}>
                Cadastrar
              </Button>
            </form>
          </Card>
          <Card>
            <SectionHeader title="Catálogo" />
            <ul className="mt-4 divide-y divide-[var(--border-default)]">
              {procedures.map((p) => (
                <li key={p.id} className="py-3 text-sm">
                  {editingProcedure?.id === p.id ? (
                    <form onSubmit={saveProcedureEdit} className="space-y-2 rounded border border-[var(--border-muted)] p-3">
                      <input
                        required
                        className={fieldClass}
                        value={editingProcedure.code}
                        onChange={(e) =>
                          setEditingProcedure({ ...editingProcedure, code: e.target.value })
                        }
                      />
                      <input
                        required
                        className={fieldClass}
                        value={editingProcedure.name}
                        onChange={(e) =>
                          setEditingProcedure({ ...editingProcedure, name: e.target.value })
                        }
                      />
                      <select
                        className={fieldClass}
                        value={editingProcedure.category}
                        onChange={(e) =>
                          setEditingProcedure({ ...editingProcedure, category: e.target.value })
                        }
                      >
                        <option value="CONSULTA">Consulta</option>
                        <option value="EXAME">Exame</option>
                      </select>
                      <input
                        required
                        type="number"
                        step="0.01"
                        className={fieldClass}
                        value={editingProcedure.basePrice}
                        onChange={(e) =>
                          setEditingProcedure({
                            ...editingProcedure,
                            basePrice: Number(e.target.value),
                          })
                        }
                      />
                      <div className="flex gap-2">
                        <Button type="submit" size="sm" variant="portal" disabled={isBusy(`edit-proc-${p.id}`)}>
                          Salvar
                        </Button>
                        <Button type="button" size="sm" variant="secondary" onClick={() => setEditingProcedure(null)}>
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex justify-between gap-2">
                      <span>
                        {p.code} — {p.name} ({p.basePriceLabel})
                      </span>
                      <div className="flex gap-1">
                        <Button type="button" size="sm" variant="ghost" onClick={() => setEditingProcedure({ ...p })}>
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isBusy(`del-${p.id}`)}
                          onClick={() => deleteProcedure(p.id, `${p.code} — ${p.name}`)}
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {tab === "protocols" && (
        <Card>
          <SectionHeader
            title="Protocolos clínicos"
            description="Templates de cuidado aplicáveis no atendimento (HAS, DM2, etc.)."
          />
          <div className="mt-4">
            <ProtocolTemplatesPanel />
          </div>
        </Card>
      )}

      {tab === "users" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <SectionHeader title="Novo usuário" />
            <form onSubmit={submitUser} className="mt-4 space-y-3">
              <label className="block text-sm">
                <span className="text-[var(--text-secondary)]">Nome</span>
                <input
                  required
                  className={fieldClass}
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                <span className="text-[var(--text-secondary)]">E-mail</span>
                <input
                  required
                  type="email"
                  className={fieldClass}
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                <span className="text-[var(--text-secondary)]">Senha</span>
                <input
                  required
                  className={fieldClass}
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                <span className="text-[var(--text-secondary)]">Perfil</span>
                <select
                  className={fieldClass}
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                >
                  <option value="PRESTADOR">Prestador</option>
                  <option value="INTERNO">Interno</option>
                  <option value="PJ">Empresa PJ</option>
                  <option value="BENEFICIARIO">Beneficiário</option>
                </select>
              </label>
              {userForm.role === "INTERNO" && (
                <label className="block text-sm">
                  <span className="text-[var(--text-secondary)]">Perfil interno (RBAC)</span>
                  <select
                    className={fieldClass}
                    value={userForm.internoProfile}
                    onChange={(e) => setUserForm({ ...userForm, internoProfile: e.target.value })}
                  >
                    <option value="">Administrador (padrão)</option>
                    <option value="FATURAMENTO">Faturamento</option>
                    <option value="RECEPCAO">Recepção</option>
                    <option value="READONLY">Somente leitura</option>
                  </select>
                </label>
              )}
              {userForm.role === "PJ" && (
                <label className="block text-sm">
                  <span className="text-[var(--text-secondary)]">Empresa</span>
                  <select
                    required
                    className={fieldClass}
                    value={userForm.companyId}
                    onChange={(e) => setUserForm({ ...userForm, companyId: e.target.value })}
                  >
                    <option value="">Selecione...</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {userForm.role === "BENEFICIARIO" && (
                <label className="block text-sm">
                  <span className="text-[var(--text-secondary)]">Beneficiário</span>
                  <select
                    required
                    className={fieldClass}
                    value={userForm.patientId}
                    onChange={(e) => setUserForm({ ...userForm, patientId: e.target.value })}
                  >
                    <option value="">Selecione...</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <UserProfessionalFields
                show={userForm.role === "PRESTADOR"}
                values={{
                  phone: userForm.phone,
                  councilType: userForm.councilType,
                  councilNumber: userForm.councilNumber,
                  councilUf: userForm.councilUf,
                  specialty: userForm.specialty,
                }}
                onChange={(patch) => setUserForm({ ...userForm, ...patch })}
              />
              <Button type="submit" variant="portal" disabled={isBusy("user")}>
                Criar usuário
              </Button>
            </form>
          </Card>
          <Card>
            <SectionHeader title="Usuários" />
            <ul className="mt-4 divide-y divide-[var(--border-default)]">
              {users.map((u) => (
                <li key={u.id} className="py-3 text-sm">
                  {editingUser?.id === u.id ? (
                    <form onSubmit={saveUserEdit} className="space-y-2 rounded border border-[var(--border-muted)] p-3">
                      <input
                        required
                        className={fieldClass}
                        value={editingUser.name}
                        onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                      />
                      <input
                        required
                        type="email"
                        className={fieldClass}
                        value={editingUser.email}
                        onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                      />
                      <input
                        className={fieldClass}
                        placeholder="Nova senha (opcional)"
                        value={userEditPassword}
                        onChange={(e) => setUserEditPassword(e.target.value)}
                      />
                      <select
                        className={fieldClass}
                        value={editingUser.role}
                        onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                      >
                        <option value="PRESTADOR">Prestador</option>
                        <option value="INTERNO">Interno</option>
                        <option value="PJ">Empresa PJ</option>
                        <option value="BENEFICIARIO">Beneficiário</option>
                      </select>
                      {editingUser.role === "INTERNO" && (
                        <select
                          className={fieldClass}
                          value={editingUser.internoProfile ?? ""}
                          onChange={(e) =>
                            setEditingUser({
                              ...editingUser,
                              internoProfile: e.target.value || null,
                            })
                          }
                        >
                          <option value="">Administrador</option>
                          <option value="FATURAMENTO">Faturamento</option>
                          <option value="RECEPCAO">Recepção</option>
                          <option value="READONLY">Somente leitura</option>
                        </select>
                      )}
                      {editingUser.role === "PJ" && (
                        <select
                          className={fieldClass}
                          value={editingUser.companyId ?? ""}
                          onChange={(e) =>
                            setEditingUser({
                              ...editingUser,
                              companyId: e.target.value || null,
                            })
                          }
                        >
                          <option value="">Selecione...</option>
                          {companies.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      )}
                      {editingUser.role === "BENEFICIARIO" && (
                        <select
                          className={fieldClass}
                          value={editingUser.patientId ?? ""}
                          onChange={(e) =>
                            setEditingUser({
                              ...editingUser,
                              patientId: e.target.value || null,
                            })
                          }
                        >
                          <option value="">Selecione...</option>
                          {patients.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      )}
                      <UserProfessionalFields
                        show={editingUser.role === "PRESTADOR"}
                        values={{
                          phone: editingUser.phone ?? "",
                          councilType: editingUser.councilType ?? "",
                          councilNumber: editingUser.councilNumber ?? "",
                          councilUf: editingUser.councilUf ?? "",
                          specialty: editingUser.specialty ?? "",
                        }}
                        onChange={(patch) =>
                          setEditingUser({ ...editingUser, ...patch })
                        }
                      />
                      <div className="flex gap-2">
                        <Button type="submit" size="sm" variant="portal" disabled={isBusy(`edit-user-${u.id}`)}>
                          Salvar
                        </Button>
                        <Button type="button" size="sm" variant="secondary" onClick={() => { setEditingUser(null); setUserEditPassword(""); }}>
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex justify-between gap-2">
                      <div>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-[var(--text-muted)]">
                          {u.email} · {u.role}
                          {u.internoProfile ? ` · ${u.internoProfile}` : ""}
                        </p>
                      </div>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setEditingUser({ ...u })}>
                        Editar
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {tab === "pricing" && <CadastrosPricingTab />}

      {tab === "operations" && (
        <div className="space-y-6" data-tour-id="cadastros-crud-map">
          <Card>
            <SectionHeader
              title="Mapa de operações CRUD"
              description="Onde cada entidade do sistema pode ser criada, consultada, alterada ou removida na interface."
            />
            <div className="mt-4">
              <CrudOperationsMap />
            </div>
          </Card>
          <Card>
            <SectionHeader
              title="Mapa de melhorias de fluxo"
              description="Passos de jornada implementados e backlog priorizado por portal."
            />
            <div className="mt-4">
              <FlowImprovementsMap />
            </div>
          </Card>
        </div>
      )}
      </div>
    </ViewStateBoundary>
  );
}
