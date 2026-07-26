import { INTERNO_ROUTE_LABELS } from "@/lib/navigation/routes";
import type { NicheLabels } from "@/lib/niche/types";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

/** Monta trilha de breadcrumbs para Cliente 360° no portal interno. */
export function buildPatientBreadcrumbs(
  from: string | undefined,
  patientName?: string,
): BreadcrumbItem[] {
  const origin = from && INTERNO_ROUTE_LABELS[from] ? from : "/interno";
  const items: BreadcrumbItem[] = [
    { label: INTERNO_ROUTE_LABELS[origin] ?? "Faturamento", href: origin },
    { label: "Cliente 360°" },
  ];
  if (patientName) {
    items.push({ label: patientName });
  }
  return items;
}

/** Monta trilha para atendimento do prestador. */
export function buildAtendimentoBreadcrumbs(patientName?: string): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [
    { label: "Agenda", href: "/prestador" },
    { label: "Atendimento" },
  ];
  if (patientName) {
    items.push({ label: patientName });
  }
  return items;
}

/** Monta trilha para histórico do paciente no portal prestador (termo por nicho). */
export function buildPatientHistoryBreadcrumbs(
  patientName?: string,
  labels?: NicheLabels,
): BreadcrumbItem[] {
  const patientTerm = labels?.patient?.toLowerCase() ?? "paciente";
  const items: BreadcrumbItem[] = [
    { label: "Agenda", href: "/prestador" },
    { label: `Histórico do ${patientTerm}` },
  ];
  if (patientName) {
    items.push({ label: patientName });
  }
  return items;
}
