import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import PageHeader from "@/components/layout/PageHeader";
import PrestadorDashboardView from "@/components/PrestadorDashboardView";

export default async function PrestadorDashboardPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "PRESTADOR") {
    redirect("/login");
  }

  return (
    <>
      <PageHeader
        title={`Bem-vinda, ${user.name}`}
        description="Indicadores do dia e fila de atendimentos."
      />
      <PrestadorDashboardView />
    </>
  );
}
