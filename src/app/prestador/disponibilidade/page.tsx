import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import PageHeader from "@/components/layout/PageHeader";
import DisponibilidadeView from "@/components/DisponibilidadeView";

export default async function PrestadorDisponibilidadePage() {
  const user = await getSessionUser();
  if (!user || user.role !== "PRESTADOR") {
    redirect("/login");
  }

  return (
    <>
      <PageHeader
        title="Disponibilidade"
        description="Publique sua grade semanal e bloqueios. Esses horários alimentam o agendamento do beneficiário."
      />
      <DisponibilidadeView />
    </>
  );
}
