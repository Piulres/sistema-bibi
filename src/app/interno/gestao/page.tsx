import PageHeader from "@/components/layout/PageHeader";
import ClinicFinanceView from "@/components/ClinicFinanceView";
import { requireInternoPage } from "@/lib/interno-guard";

type PageProps = {
  searchParams: Promise<{
    appointmentId?: string;
    patientId?: string;
    patientName?: string;
    providerId?: string;
    procedureId?: string;
  }>;
};

export default async function InternoGestaoPage({ searchParams }: PageProps) {
  await requireInternoPage("gestao");
  const q = await searchParams;

  return (
    <>
      <PageHeader
        title="Gestão clínica"
        description="Lançamentos por paciente, despesas do mês e indicadores automáticos — pensado para a secretária e para a direção. Cada lançamento gera agenda, uso PPU e fatura."
      />
      <ClinicFinanceView
        prefill={{
          appointmentId: q.appointmentId,
          patientId: q.patientId,
          patientName: q.patientName,
          providerId: q.providerId,
          procedureId: q.procedureId,
        }}
      />
    </>
  );
}
