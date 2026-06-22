import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import PageHeader from "@/components/layout/PageHeader";
import PjView from "@/components/PjView";

export default async function PjDashboard() {
  const user = await getSessionUser();
  if (!user || user.role !== "PJ") {
    redirect("/pj/login");
  }

  return (
    <>
      <PageHeader
        title={user.companyName ?? "Empresa"}
        description="Gestão de contrato, beneficiários e faturas corporativas."
      />
      <PjView />
    </>
  );
}
