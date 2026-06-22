import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import PageHeader from "@/components/layout/PageHeader";
import PrestadorReportsView from "@/components/PrestadorReportsView";

export default async function PrestadorReportsPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "PRESTADOR") redirect("/login");

  return (
    <>
      <PageHeader
        title="Relatórios"
        description="Exporte seus dados em CSV para análise."
      />
      <PrestadorReportsView />
    </>
  );
}
