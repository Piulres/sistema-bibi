import Breadcrumbs from "@/components/ui/Breadcrumbs";
import PageHeader from "@/components/layout/PageHeader";
import PatientOverviewView from "@/components/PatientOverviewView";
import { buildPatientBreadcrumbs } from "@/lib/navigation";
import { requireInternoPage } from "@/lib/interno-guard";

export default async function PatientOverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  await requireInternoPage("cadastros");

  const { id } = await params;
  const { from } = await searchParams;

  return (
    <>
      <Breadcrumbs items={buildPatientBreadcrumbs(from)} className="mb-4" />
      <PageHeader
        title="Cliente 360°"
        description="Visão consolidada do beneficiário — dados, atendimentos, procedimentos e faturamento."
      />
      <PatientOverviewView patientId={id} />
    </>
  );
}
