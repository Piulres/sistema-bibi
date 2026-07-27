"use client";

import { useCallback, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ViewStateBoundary from "@/components/ui/ViewStateBoundary";
import SectionHeader from "@/components/ui/SectionHeader";
import CalloutCard from "@/components/ui/CalloutCard";
import {
  UserProfessionalFields,
  emptyUserProfessional,
} from "@/components/cadastros/CadastroExtraFields";
import {
  CADASTROS_FIELD_CLASS,
  type CompanyRow,
  type PatientRow,
  type UserRow,
} from "@/components/cadastros/types";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { fetchJson } from "@/lib/ui/api-feedback";

type UsersPayload = {
  users: UserRow[];
  companies: CompanyRow[];
  patients: PatientRow[];
};

type CadastrosUsersTabProps = {
  canManageUsers?: boolean;
};

export default function CadastrosUsersTab({ canManageUsers = false }: CadastrosUsersTabProps) {
  const { isBusy, run, showToast } = useAsyncAction();
  const fieldClass = CADASTROS_FIELD_CLASS;

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
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [userEditPassword, setUserEditPassword] = useState("");

  const loadUsers = useCallback(async () => {
    const [uRes, cRes, pRes] = await Promise.all([
      fetchJson<{ users?: UserRow[] }>(
        "/api/interno/users",
        undefined,
        "Erro ao carregar usuários",
      ),
      fetchJson<{ companies?: CompanyRow[] }>(
        "/api/interno/companies",
        undefined,
        "Erro ao carregar empresas",
      ),
      fetchJson<{ patients?: PatientRow[] }>(
        "/api/interno/patients",
        undefined,
        "Erro ao carregar beneficiários",
      ),
    ]);
    if (!uRes.ok) return uRes;
    if (!cRes.ok) return cRes;
    if (!pRes.ok) return pRes;
    return {
      ok: true as const,
      data: {
        users: uRes.data.users ?? [],
        companies: cRes.data.companies ?? [],
        patients: pRes.data.patients ?? [],
      },
      status: 200,
    };
  }, []);

  const { data, loading, error, reload } = useAsyncData<UsersPayload>(loadUsers, [], {
    forbiddenMessage: "Sem permissão para acessar cadastros",
  });

  const users = data?.users ?? [];
  const companies = data?.companies ?? [];
  const patients = data?.patients ?? [];

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
          const user = body.user as { name: string; email?: string; role?: string };
          const isProvider = user.role === "PRESTADOR";
          showToast({
            message: isProvider
              ? `${user.name} criado. Entrar em /login?tenant=… (Portal Prestador) com o e-mail e a senha definidos`
              : `Usuário ${user.name} criado`,
            tone: "success",
          });
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

  return (
    <ViewStateBoundary
      loading={loading}
      error={error}
      loadingMessage="Carregando usuários..."
      onRetry={() => void reload()}
    >
      <div className="space-y-6">
        {!canManageUsers ? (
          <CalloutCard
            data-tour-id="cadastros-users-admin-only"
            variant="warning"
            title="Criar ou editar usuários exige administrador"
            description="Sua conta de recepção pode listar usuários, mas não criar novos. Entre com o ADMIN do tenant (CEDIG: operacao@cedig.demo / bibi123) em Cadastros → Usuários."
            badge="RBAC"
          />
        ) : null}
        <div className="grid gap-6 lg:grid-cols-2">
          {canManageUsers ? (
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
          ) : null}
          <Card className={canManageUsers ? undefined : "lg:col-span-2"}>
            <SectionHeader
              title="Usuários"
              description={
                canManageUsers
                  ? undefined
                  : "Somente leitura nesta conta — peça a um administrador para criar ou editar."
              }
            />
            <ul className="mt-4 divide-y divide-[var(--border-default)]">
              {users.map((u) => (
                <li key={u.id} className="py-3 text-sm">
                  {canManageUsers && editingUser?.id === u.id ? (
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
                      {canManageUsers ? (
                        <Button type="button" size="sm" variant="ghost" onClick={() => setEditingUser({ ...u })}>
                          Editar
                        </Button>
                      ) : null}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </ViewStateBoundary>
  );
}
