import "server-only";

/** Snapshots serializáveis para diff e restore futuro (Pacote A). */

export function snapshotPatient(p: {
  name: string;
  cpf: string;
  birthDate: Date;
  phone: string | null;
  email: string | null;
  gender: string | null;
  motherName: string | null;
  employeeId: string | null;
  bondType: string | null;
  companyId: string | null;
  company?: { name: string } | null;
}): Record<string, unknown> {
  return {
    name: p.name,
    cpf: p.cpf,
    birthDate: p.birthDate.toISOString().slice(0, 10),
    phone: p.phone,
    email: p.email,
    gender: p.gender,
    motherName: p.motherName,
    employeeId: p.employeeId,
    bondType: p.bondType,
    companyId: p.companyId,
    companyName: p.company?.name ?? null,
  };
}

export function snapshotCompany(c: {
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
  contractActive: boolean;
}): Record<string, unknown> {
  return {
    name: c.name,
    cnpj: c.cnpj,
    tradeName: c.tradeName,
    email: c.email,
    phone: c.phone,
    contactName: c.contactName,
    contactEmail: c.contactEmail,
    contactPhone: c.contactPhone,
    addressStreet: c.addressStreet,
    addressCity: c.addressCity,
    addressState: c.addressState,
    addressZip: c.addressZip,
    status: c.status,
    contractActive: c.contractActive,
  };
}

export function snapshotPricingRule(r: {
  multiplier: number;
  description: string;
  procedureId: string;
  companyId: string | null;
  procedure?: { code: string; name: string } | null;
  company?: { name: string } | null;
}): Record<string, unknown> {
  return {
    multiplier: r.multiplier,
    description: r.description,
    procedureId: r.procedureId,
    companyId: r.companyId,
    procedureCode: r.procedure?.code ?? null,
    procedureName: r.procedure?.name ?? null,
    companyName: r.company?.name ?? null,
  };
}

export function snapshotProcedure(p: {
  code: string;
  name: string;
  category: string;
  basePrice: number;
}): Record<string, unknown> {
  return {
    code: p.code,
    name: p.name,
    category: p.category,
    basePrice: p.basePrice,
  };
}

export function snapshotBranding(b: {
  displayName: string;
  tagline: string | null;
  primaryColor: string;
  accentColor: string;
  heroFrom: string;
  heroTo: string;
  platformLabel: string;
  colorScheme: string;
  customDomain: string | null;
  customDomainVerified: boolean;
}): Record<string, unknown> {
  return {
    displayName: b.displayName,
    tagline: b.tagline,
    primaryColor: b.primaryColor,
    accentColor: b.accentColor,
    heroFrom: b.heroFrom,
    heroTo: b.heroTo,
    platformLabel: b.platformLabel,
    colorScheme: b.colorScheme,
    customDomain: b.customDomain,
    customDomainVerified: b.customDomainVerified,
  };
}
