"use client";

import { useCallback, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ViewStateBoundary from "@/components/ui/ViewStateBoundary";
import SectionHeader from "@/components/ui/SectionHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  CompanyExtraFields,
  CompanyStatusSelect,
  emptyCompanyExtra,
} from "@/components/cadastros/CadastroExtraFields";
import ImportInterchangePanel from "@/components/cadastros/ImportInterchangePanel";
import { CADASTROS_FIELD_CLASS, type CompanyRow } from "@/components/cadastros/types";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { fetchJson } from "@/lib/ui/api-feedback";

type CompaniesPayload = {
  companies: CompanyRow[];
};

export default function CadastrosCompaniesTab() {
  const { isBusy, run, showToast } = useAsyncAction();
  const fieldClass = CADASTROS_FIELD_CLASS;

  const [companyForm, setCompanyForm] = useState({
    name: "",
    cnpj: "",
    status: "ATIVO",
    ...emptyCompanyExtra(),
  });
  const [editingCompany, setEditingCompany] = useState<CompanyRow | null>(null);

  const loadCompanies = useCallback(async () => {
    const cRes = await fetchJson<{ companies?: CompanyRow[] }>(
      "/api/interno/companies",
      undefined,
      "Erro ao carregar empresas",
    );
    if (!cRes.ok) return cRes;
    return {
      ok: true as const,
      data: { companies: cRes.data.companies ?? [] },
      status: 200,
    };
  }, []);

  const { data, loading, error, reload } = useAsyncData<CompaniesPayload>(loadCompanies, [], {
    forbiddenMessage: "Sem permissão para acessar cadastros",
  });

  const companies = data?.companies ?? [];

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

  return (
    <ViewStateBoundary
      loading={loading}
      error={error}
      loadingMessage="Carregando empresas..."
      onRetry={() => void reload()}
    >
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
    </ViewStateBoundary>
  );
}
