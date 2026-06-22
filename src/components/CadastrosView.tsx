"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import LoadingState from "@/components/ui/LoadingState";
import SectionHeader from "@/components/ui/SectionHeader";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";
import CrudOperationsMap from "@/components/CrudOperationsMap";
import FlowImprovementsMap from "@/components/FlowImprovementsMap";
import TabBar from "@/components/ui/TabBar";

const tabs = [
  { key: "patients", label: "Beneficiários" },
  { key: "companies", label: "Empresas" },
  { key: "procedures", label: "Procedimentos" },
  { key: "users", label: "Usuários" },
  { key: "operations", label: "Mapa CRUD" },
] as const;

type Tab = (typeof tabs)[number]["key"];

const fieldClass =
  "mt-1 w-full rounded-[var(--radius-button)] border border-[var(--border-muted)] bg-[var(--surface-card)] px-3 py-2 text-sm";

type PatientRow = {
  id: string;
  name: string;
  cpf: string;
  birthDate: string;
  birthDateLabel: string;
  phone: string | null;
  companyId: string | null;
  companyName: string | null;
};

type CompanyRow = {
  id: string;
  name: string;
  cnpj: string;
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
};

export default function CadastrosView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const tab: Tab =
    tabFromUrl && tabs.some((t) => t.key === tabFromUrl) ? (tabFromUrl as Tab) : "patients";

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [procedures, setProcedures] = useState<ProcedureRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);

  const [patientForm, setPatientForm] = useState({
    name: "",
    cpf: "",
    birthDate: "",
    phone: "",
    companyId: "",
  });
  const [companyForm, setCompanyForm] = useState({ name: "", cnpj: "", status: "ATIVO" });
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
  });

  const [editingPatient, setEditingPatient] = useState<PatientRow | null>(null);
  const [editingCompany, setEditingCompany] = useState<CompanyRow | null>(null);
  const [editingProcedure, setEditingProcedure] = useState<ProcedureRow | null>(null);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [userEditPassword, setUserEditPassword] = useState("");

  const selectTab = useCallback(
    (next: Tab) => {
      router.replace(`/interno/cadastros?tab=${next}`, { scroll: false });
    },
    [router],
  );

  const load = useCallback(async () => {
    const [p, c, pr, u] = await Promise.all([
      fetch("/api/interno/patients").then((r) => r.json()),
      fetch("/api/interno/companies").then((r) => r.json()),
      fetch("/api/interno/procedures").then((r) => r.json()),
      fetch("/api/interno/users").then((r) => r.json()),
    ]);
    setPatients(p.patients ?? []);
    setCompanies(c.companies ?? []);
    setProcedures(pr.procedures ?? []);
    setUsers(u.users ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      await load();
      if (!active) return;
    })();
    return () => {
      active = false;
    };
  }, [load]);

  async function submitPatient(e: React.FormEvent) {
    e.preventDefault();
    setBusy("patient");
    setMsg(null);
    try {
      const res = await fetch("/api/interno/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...patientForm,
          companyId: patientForm.companyId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) setMsg(data.error ?? "Erro");
      else {
        setMsg(`Beneficiário ${data.patient.name} cadastrado`);
        setPatientForm({ name: "", cpf: "", birthDate: "", phone: "", companyId: "" });
        await load();
      }
    } finally {
      setBusy(null);
    }
  }

  async function savePatientEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPatient) return;
    setBusy(`edit-patient-${editingPatient.id}`);
    setMsg(null);
    try {
      const res = await fetch(`/api/interno/patients/${editingPatient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingPatient.name,
          cpf: editingPatient.cpf,
          birthDate: editingPatient.birthDate,
          phone: editingPatient.phone,
          companyId: editingPatient.companyId,
        }),
      });
      const data = await res.json();
      if (!res.ok) setMsg(data.error ?? "Erro ao atualizar");
      else {
        setMsg(`Beneficiário ${data.patient.name} atualizado`);
        setEditingPatient(null);
        await load();
      }
    } finally {
      setBusy(null);
    }
  }

  async function submitCompany(e: React.FormEvent) {
    e.preventDefault();
    setBusy("company");
    setMsg(null);
    try {
      const res = await fetch("/api/interno/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(companyForm),
      });
      const data = await res.json();
      if (!res.ok) setMsg(data.error ?? "Erro");
      else {
        setMsg(`Empresa ${data.company.name} cadastrada`);
        setCompanyForm({ name: "", cnpj: "", status: "ATIVO" });
        await load();
      }
    } finally {
      setBusy(null);
    }
  }

  async function saveCompanyEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCompany) return;
    setBusy(`edit-company-${editingCompany.id}`);
    setMsg(null);
    try {
      const res = await fetch(`/api/interno/companies/${editingCompany.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingCompany.name,
          cnpj: editingCompany.cnpj,
          status: editingCompany.status,
          contractActive: editingCompany.contractActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) setMsg(data.error ?? "Erro ao atualizar");
      else {
        setMsg(`Empresa ${data.company.name} atualizada`);
        setEditingCompany(null);
        await load();
      }
    } finally {
      setBusy(null);
    }
  }

  async function submitProcedure(e: React.FormEvent) {
    e.preventDefault();
    setBusy("procedure");
    setMsg(null);
    try {
      const res = await fetch("/api/interno/procedures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...procForm,
          basePrice: Number(procForm.basePrice),
        }),
      });
      const data = await res.json();
      if (!res.ok) setMsg(data.error ?? "Erro");
      else {
        setMsg(`Procedimento ${data.procedure.code} cadastrado`);
        setProcForm({ code: "", name: "", category: "CONSULTA", basePrice: "150" });
        await load();
      }
    } finally {
      setBusy(null);
    }
  }

  async function saveProcedureEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingProcedure) return;
    setBusy(`edit-proc-${editingProcedure.id}`);
    setMsg(null);
    try {
      const res = await fetch(`/api/interno/procedures/${editingProcedure.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: editingProcedure.code,
          name: editingProcedure.name,
          category: editingProcedure.category,
          basePrice: editingProcedure.basePrice,
        }),
      });
      const data = await res.json();
      if (!res.ok) setMsg(data.error ?? "Erro ao atualizar");
      else {
        setMsg(`Procedimento ${data.procedure.code} atualizado`);
        setEditingProcedure(null);
        await load();
      }
    } finally {
      setBusy(null);
    }
  }

  async function submitUser(e: React.FormEvent) {
    e.preventDefault();
    setBusy("user");
    setMsg(null);
    try {
      const res = await fetch("/api/interno/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...userForm,
          companyId: userForm.companyId || null,
          patientId: userForm.patientId || null,
          internoProfile: userForm.role === "INTERNO" ? userForm.internoProfile || null : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) setMsg(data.error ?? "Erro");
      else {
        setMsg(`Usuário ${data.user.name} criado`);
        setUserForm({
          name: "",
          email: "",
          password: "bibi123",
          role: "PRESTADOR",
          internoProfile: "",
          companyId: "",
          patientId: "",
        });
        await load();
      }
    } finally {
      setBusy(null);
    }
  }

  async function saveUserEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    setBusy(`edit-user-${editingUser.id}`);
    setMsg(null);
    try {
      const body: Record<string, unknown> = {
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
        companyId: editingUser.companyId,
        patientId: editingUser.patientId,
      };
      if (userEditPassword) body.password = userEditPassword;
      if (editingUser.role === "INTERNO") {
        body.internoProfile = editingUser.internoProfile;
      }

      const res = await fetch(`/api/interno/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) setMsg(data.error ?? "Erro ao atualizar");
      else {
        setMsg(`Usuário ${data.user.name} atualizado`);
        setEditingUser(null);
        setUserEditPassword("");
        await load();
      }
    } finally {
      setBusy(null);
    }
  }

  async function deleteProcedure(id: string) {
    setBusy(`del-${id}`);
    try {
      const res = await fetch(`/api/interno/procedures/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) setMsg(data.error ?? "Erro ao excluir");
      else await load();
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <LoadingState message="Carregando cadastros..." />;

  return (
    <div className="space-y-6">
      {msg && <Alert tone="info">{msg}</Alert>}

      <TabBar
        tabs={tabs.map((t) => ({ key: t.key, label: t.label }))}
        active={tab}
        onSelect={(key) => selectTab(key as Tab)}
      />

      {tab === "patients" && (
        <div className="grid gap-6 lg:grid-cols-2">
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
              <Button type="submit" variant="portal" disabled={busy === "patient"}>
                {busy === "patient" ? "Salvando..." : "Cadastrar"}
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
                        <div className="flex gap-2">
                          <Button
                            type="submit"
                            size="sm"
                            variant="portal"
                            disabled={busy === `edit-patient-${p.id}`}
                          >
                            Salvar
                          </Button>
                          <Button type="button" size="sm" variant="secondary" onClick={() => setEditingPatient(null)}>
                            Cancelar
                          </Button>
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
                        <Button type="button" size="sm" variant="ghost" onClick={() => setEditingPatient({ ...p })}>
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

      {tab === "companies" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <SectionHeader title="Nova empresa" />
            <form onSubmit={submitCompany} className="mt-4 space-y-3">
              <label className="block text-sm">
                <span className="text-[var(--text-secondary)]">Nome</span>
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
              <Button type="submit" variant="portal" disabled={busy === "company"}>
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
                      <select
                        className={fieldClass}
                        value={editingCompany.status}
                        onChange={(e) =>
                          setEditingCompany({ ...editingCompany, status: e.target.value })
                        }
                      >
                        <option value="ATIVO">Ativo</option>
                        <option value="INADIMPLENTE">Inadimplente</option>
                        <option value="SUSPENSO">Suspenso</option>
                        <option value="CANCELADO">Cancelado</option>
                      </select>
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
                        <Button type="submit" size="sm" variant="portal" disabled={busy === `edit-company-${c.id}`}>
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
              <Button type="submit" variant="portal" disabled={busy === "procedure"}>
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
                        <Button type="submit" size="sm" variant="portal" disabled={busy === `edit-proc-${p.id}`}>
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
                          disabled={busy === `del-${p.id}`}
                          onClick={() => deleteProcedure(p.id)}
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
              <Button type="submit" variant="portal" disabled={busy === "user"}>
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
                      <div className="flex gap-2">
                        <Button type="submit" size="sm" variant="portal" disabled={busy === `edit-user-${u.id}`}>
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

      {tab === "operations" && (
        <div className="space-y-6">
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
  );
}
