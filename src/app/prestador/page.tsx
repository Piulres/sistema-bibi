import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import PageHeader from "@/components/layout/PageHeader";
import AgendaView from "@/components/AgendaView";

export default async function PrestadorDashboard() {
  const user = await getSessionUser();
  if (!user || user.role !== "PRESTADOR") {
    redirect("/login");
  }

  return (
    <>
      <PageHeader
        title={`Bem-vinda, ${user.name}`}
        description="Sua agenda do dia e acesso rápido ao prontuário eletrônico."
      />
      <AgendaView />
    </>
  );
}
