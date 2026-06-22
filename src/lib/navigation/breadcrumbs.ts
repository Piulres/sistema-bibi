import { INTERNO_ROUTE_LABELS } from "@/lib/navigation/routes";

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

/** Monta trilha para histórico do paciente no portal prestador. */
export function buildPatientHistoryBreadcrumbs(patientName?: string): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [
    { label: "Agenda", href: "/prestador" },
    { label: "Histórico do paciente" },
  ];
  if (patientName) {
    items.push({ label: patientName });
  }
  return items;
}
