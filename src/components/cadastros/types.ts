export const CADASTROS_FIELD_CLASS =
  "mt-1 w-full rounded-[var(--radius-button)] border border-[var(--border-muted)] bg-[var(--surface-card)] px-3 py-2 text-sm";

export type PatientRow = {
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

export type CompanyRow = {
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

export type ProcedureRow = {
  id: string;
  code: string;
  name: string;
  category: string;
  basePrice: number;
  basePriceLabel: string;
};

export type UserRow = {
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

export type CadastrosTabKey =
  | "patients"
  | "pets"
  | "companies"
  | "procedures"
  | "pricing"
  | "protocols"
  | "users"
  | "operations";
