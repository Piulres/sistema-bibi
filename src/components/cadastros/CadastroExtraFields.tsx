"use client";

import { COMPANY_STATUSES } from "@/lib/company-crm";
import { COUNCIL_TYPES, PATIENT_BOND_TYPES, PATIENT_GENDERS } from "@/lib/cadastro-constants";

const fieldClass =
  "mt-1 w-full rounded-[var(--radius-button)] border border-[var(--border-muted)] bg-[var(--surface-card)] px-3 py-2 text-sm";

export function CompanyExtraFields({
  values,
  onChange,
}: {
  values: {
    tradeName: string;
    email: string;
    phone: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    addressStreet: string;
    addressCity: string;
    addressState: string;
    addressZip: string;
  };
  onChange: (patch: Partial<typeof values>) => void;
}) {
  return (
    <details className="rounded-lg border border-[var(--border-muted)] p-3">
      <summary className="cursor-pointer text-sm font-medium text-[var(--text-secondary)]">
        Dados corporativos (mercado B2B)
      </summary>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm sm:col-span-2">
          <span className="text-[var(--text-secondary)]">Nome fantasia</span>
          <input
            className={fieldClass}
            value={values.tradeName}
            onChange={(e) => onChange({ tradeName: e.target.value })}
          />
        </label>
        <label className="block text-sm">
          <span className="text-[var(--text-secondary)]">E-mail corporativo</span>
          <input
            type="email"
            className={fieldClass}
            value={values.email}
            onChange={(e) => onChange({ email: e.target.value })}
          />
        </label>
        <label className="block text-sm">
          <span className="text-[var(--text-secondary)]">Telefone</span>
          <input
            className={fieldClass}
            value={values.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="text-[var(--text-secondary)]">Responsável (RH / contratante)</span>
          <input
            className={fieldClass}
            value={values.contactName}
            onChange={(e) => onChange({ contactName: e.target.value })}
          />
        </label>
        <label className="block text-sm">
          <span className="text-[var(--text-secondary)]">E-mail do responsável</span>
          <input
            type="email"
            className={fieldClass}
            value={values.contactEmail}
            onChange={(e) => onChange({ contactEmail: e.target.value })}
          />
        </label>
        <label className="block text-sm">
          <span className="text-[var(--text-secondary)]">Telefone do responsável</span>
          <input
            className={fieldClass}
            value={values.contactPhone}
            onChange={(e) => onChange({ contactPhone: e.target.value })}
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="text-[var(--text-secondary)]">Endereço</span>
          <input
            className={fieldClass}
            placeholder="Rua, número, complemento"
            value={values.addressStreet}
            onChange={(e) => onChange({ addressStreet: e.target.value })}
          />
        </label>
        <label className="block text-sm">
          <span className="text-[var(--text-secondary)]">Cidade</span>
          <input
            className={fieldClass}
            value={values.addressCity}
            onChange={(e) => onChange({ addressCity: e.target.value })}
          />
        </label>
        <label className="block text-sm">
          <span className="text-[var(--text-secondary)]">UF</span>
          <input
            className={fieldClass}
            maxLength={2}
            value={values.addressState}
            onChange={(e) => onChange({ addressState: e.target.value.toUpperCase() })}
          />
        </label>
        <label className="block text-sm">
          <span className="text-[var(--text-secondary)]">CEP</span>
          <input
            className={fieldClass}
            value={values.addressZip}
            onChange={(e) => onChange({ addressZip: e.target.value })}
          />
        </label>
      </div>
    </details>
  );
}

export function CompanyStatusSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <select className={fieldClass} value={value} onChange={(e) => onChange(e.target.value)}>
      {COMPANY_STATUSES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}

export function PatientExtraFields({
  values,
  onChange,
}: {
  values: {
    email: string;
    gender: string;
    motherName: string;
    employeeId: string;
    bondType: string;
  };
  onChange: (patch: Partial<typeof values>) => void;
}) {
  return (
    <details className="rounded-lg border border-[var(--border-muted)] p-3">
      <summary className="cursor-pointer text-sm font-medium text-[var(--text-secondary)]">
        Dados complementares (operadora / ANS)
      </summary>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-[var(--text-secondary)]">E-mail</span>
          <input
            type="email"
            className={fieldClass}
            value={values.email}
            onChange={(e) => onChange({ email: e.target.value })}
          />
        </label>
        <label className="block text-sm">
          <span className="text-[var(--text-secondary)]">Sexo</span>
          <select
            className={fieldClass}
            value={values.gender}
            onChange={(e) => onChange({ gender: e.target.value })}
          >
            <option value="">Não informado</option>
            {PATIENT_GENDERS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="text-[var(--text-secondary)]">Nome da mãe</span>
          <input
            className={fieldClass}
            value={values.motherName}
            onChange={(e) => onChange({ motherName: e.target.value })}
          />
        </label>
        <label className="block text-sm">
          <span className="text-[var(--text-secondary)]">Matrícula na empresa</span>
          <input
            className={fieldClass}
            value={values.employeeId}
            onChange={(e) => onChange({ employeeId: e.target.value })}
          />
        </label>
        <label className="block text-sm">
          <span className="text-[var(--text-secondary)]">Vínculo</span>
          <select
            className={fieldClass}
            value={values.bondType}
            onChange={(e) => onChange({ bondType: e.target.value })}
          >
            <option value="">—</option>
            {PATIENT_BOND_TYPES.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
      </div>
    </details>
  );
}

export function UserProfessionalFields({
  values,
  onChange,
  show,
}: {
  values: {
    phone: string;
    councilType: string;
    councilNumber: string;
    councilUf: string;
    specialty: string;
  };
  onChange: (patch: Partial<typeof values>) => void;
  show: boolean;
}) {
  if (!show) return null;
  return (
    <details className="rounded-lg border border-[var(--border-muted)] p-3" open>
      <summary className="cursor-pointer text-sm font-medium text-[var(--text-secondary)]">
        Dados profissionais (prestador)
      </summary>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-[var(--text-secondary)]">Telefone</span>
          <input
            className={fieldClass}
            value={values.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
          />
        </label>
        <label className="block text-sm">
          <span className="text-[var(--text-secondary)]">Especialidade</span>
          <input
            className={fieldClass}
            placeholder="Ex.: Clínica Geral"
            value={values.specialty}
            onChange={(e) => onChange({ specialty: e.target.value })}
          />
        </label>
        <label className="block text-sm">
          <span className="text-[var(--text-secondary)]">Conselho</span>
          <select
            className={fieldClass}
            value={values.councilType}
            onChange={(e) => onChange({ councilType: e.target.value })}
          >
            <option value="">—</option>
            {COUNCIL_TYPES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-[var(--text-secondary)]">Nº registro</span>
          <input
            className={fieldClass}
            value={values.councilNumber}
            onChange={(e) => onChange({ councilNumber: e.target.value })}
          />
        </label>
        <label className="block text-sm">
          <span className="text-[var(--text-secondary)]">UF do conselho</span>
          <input
            className={fieldClass}
            maxLength={2}
            value={values.councilUf}
            onChange={(e) => onChange({ councilUf: e.target.value.toUpperCase() })}
          />
        </label>
      </div>
    </details>
  );
}

export const emptyCompanyExtra = () => ({
  tradeName: "",
  email: "",
  phone: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  addressStreet: "",
  addressCity: "",
  addressState: "",
  addressZip: "",
});

export const emptyPatientExtra = () => ({
  email: "",
  gender: "",
  motherName: "",
  employeeId: "",
  bondType: "",
});

export const emptyUserProfessional = () => ({
  phone: "",
  councilType: "",
  councilNumber: "",
  councilUf: "",
  specialty: "",
});
