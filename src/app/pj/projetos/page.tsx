import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import PageHeader from "@/components/layout/PageHeader";
import PjProjectsView from "@/components/projects/PjProjectsView";

export default async function PjProjetosPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "PJ") {
    redirect("/pj/login");
  }

  return (
    <>
      <PageHeader
        title={user.labels.patients}
        description="Acompanhe obras, propostas e documentação técnica da sua empresa."
      />
      <PjProjectsView />
    </>
  );
}
