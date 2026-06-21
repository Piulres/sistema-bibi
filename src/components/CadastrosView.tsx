"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import LoadingState from "@/components/ui/LoadingState";
import SectionHeader from "@/components/ui/SectionHeader";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";

const tabs = [
  { key: "patients", label: "Beneficiários" },
  { key: "companies", label: "Empresas" },
  { key: "procedures", label: "Procedimentos" },
  { key: "users", label: "Usuários" },
] as const;

type Tab = (typeof tabs)[number]["key"];

const fieldClass =
  "mt-1 w-full rounded-[var(--radius-button)] border border-[var(--border-muted)] bg-[var(--surface-card)] px-3 py-2 text-sm";

export default function CadastrosView() {
  const [tab, setTab] = useState<Tab>("patients");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [patients, setPatients] = useState<
    { id: string; name: string; cpf: string; birthDateLabel: string; companyName: string | null }[]
  >([]);
  const [companies, setCompanies] = useState<
    { id: string; name: string; cnpj: string; status: string; statusLabel: string }[]
  >([]);
  const [procedures, setProcedures] = useState<
    { id: string; code: string; name: string; category: string; basePriceLabel: string }[]
  >([]);
  const [users, setUsers] = useState<
    { id: string; name: string; email: string; role: string }[]
  >([]);

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
    companyId: "",
    patientId: "",
  });

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
          companyId: "",
          patientId: "",
        });
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

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Button
            key={t.key}
            type="button"
            variant={tab === t.key ? "portal" : "secondary"}
            size="sm"
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {tab === "patients" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <SectionHeader title="Novo beneficiário" />
            <form onSubmit={submitPatient} className="mt-4 space-y-3">
              <label className="block text-sm">
                <span className="text-[var(--text-secondary)]">Nome</span>
                <input required className={fieldClass} value={patientForm.name} onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })} />
              </label>
              <label className="block text-sm">
                <span className="text-[var(--text-secondary)]">CPF</span>
                <input required className={fieldClass} value={patientForm.cpf} onChange={(e) => setPatientForm({ ...patientForm, cpf: e.target.value })} />
              </label>
              <label className="block text-sm">
                <span className="text-[var(--text-secondary)]">Nascimento</span>
                <input required type="date" className={fieldClass} value={patientForm.birthDate} onChange={(e) => setPatientForm({ ...patientForm, birthDate: e.target.value })} />
              </label>
              <label className="block text-sm">
                <span className="text-[var(--text-secondary)]">Empresa (opcional)</span>
                <select className={fieldClass} value={patientForm.companyId} onChange={(e) => setPatientForm({ ...patientForm, companyId: e.target.value })}>
                  <option value="">Particular</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
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
                  <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <Link href={`/interno/beneficiarios/${p.id}?from=/interno/cadastros`} className="font-medium text-[var(--portal-accent)] hover:underline">
                        {p.name}
                      </Link>
                      <p className="text-[var(--text-muted)]">{p.cpf} · {p.companyName ?? "Particular"}</p>
                    </div>
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
                <input required className={fieldClass} value={companyForm.name} onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })} />
              </label>
              <label className="block text-sm">
                <span className="text-[var(--text-secondary)]">CNPJ</span>
                <input required className={fieldClass} value={companyForm.cnpj} onChange={(e) => setCompanyForm({ ...companyForm, cnpj: e.target.value })} />
              </label>
              <Button type="submit" variant="portal" disabled={busy === "company"}>Cadastrar</Button>
            </form>
          </Card>
          <Card>
            <SectionHeader title="Empresas" />
            <ul className="mt-4 divide-y divide-[var(--border-default)]">
              {companies.map((c) => (
                <li key={c.id} className="flex justify-between py-2 text-sm">
                  <span className="font-medium">{c.name}</span>
                  <StatusBadge value={c.status} map="company" />
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
                <input required className={fieldClass} value={procForm.code} onChange={(e) => setProcForm({ ...procForm, code: e.target.value })} />
              </label>
              <label className="block text-sm">
                <span className="text-[var(--text-secondary)]">Nome</span>
                <input required className={fieldClass} value={procForm.name} onChange={(e) => setProcForm({ ...procForm, name: e.target.value })} />
              </label>
              <label className="block text-sm">
                <span className="text-[var(--text-secondary)]">Preço (R$)</span>
                <input required type="number" step="0.01" className={fieldClass} value={procForm.basePrice} onChange={(e) => setProcForm({ ...procForm, basePrice: e.target.value })} />
              </label>
              <Button type="submit" variant="portal" disabled={busy === "procedure"}>Cadastrar</Button>
            </form>
          </Card>
          <Card>
            <SectionHeader title="Catálogo" />
            <ul className="mt-4 divide-y divide-[var(--border-default)]">
              {procedures.map((p) => (
                <li key={p.id} className="flex justify-between gap-2 py-2 text-sm">
                  <span>{p.code} — {p.name} ({p.basePriceLabel})</span>
                  <Button variant="ghost" size="sm" disabled={busy === `del-${p.id}`} onClick={() => deleteProcedure(p.id)}>
                    Excluir
                  </Button>
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
                <input required className={fieldClass} value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} />
              </label>
              <label className="block text-sm">
                <span className="text-[var(--text-secondary)]">E-mail</span>
                <input required type="email" className={fieldClass} value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} />
              </label>
              <label className="block text-sm">
                <span className="text-[var(--text-secondary)]">Senha</span>
                <input required className={fieldClass} value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} />
              </label>
              <label className="block text-sm">
                <span className="text-[var(--text-secondary)]">Perfil</span>
                <select className={fieldClass} value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
                  <option value="PRESTADOR">Prestador</option>
                  <option value="INTERNO">Interno</option>
                  <option value="PJ">Empresa PJ</option>
                  <option value="BENEFICIARIO">Beneficiário</option>
                </select>
              </label>
              {userForm.role === "PJ" && (
                <label className="block text-sm">
                  <span className="text-[var(--text-secondary)]">Empresa</span>
                  <select required className={fieldClass} value={userForm.companyId} onChange={(e) => setUserForm({ ...userForm, companyId: e.target.value })}>
                    <option value="">Selecione...</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </label>
              )}
              {userForm.role === "BENEFICIARIO" && (
                <label className="block text-sm">
                  <span className="text-[var(--text-secondary)]">Beneficiário</span>
                  <select required className={fieldClass} value={userForm.patientId} onChange={(e) => setUserForm({ ...userForm, patientId: e.target.value })}>
                    <option value="">Selecione...</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </label>
              )}
              <Button type="submit" variant="portal" disabled={busy === "user"}>Criar usuário</Button>
            </form>
          </Card>
          <Card>
            <SectionHeader title="Usuários" />
            <ul className="mt-4 divide-y divide-[var(--border-default)]">
              {users.map((u) => (
                <li key={u.id} className="py-2 text-sm">
                  <p className="font-medium">{u.name}</p>
                  <p className="text-[var(--text-muted)]">{u.email} · {u.role}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}
