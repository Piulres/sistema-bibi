import PageHeader from "@/components/layout/PageHeader";
import AppointmentsView from "@/components/AppointmentsView";
import { requireInternoPage } from "@/lib/interno-guard";

export default async function InternoAgendaPage() {
  await requireInternoPage("agenda");

  return (
    <>
      <PageHeader
        title="Agenda"
        description="Gestão de consultas e atendimentos do tenant."
      />
      <AppointmentsView />
    </>
  );
}
