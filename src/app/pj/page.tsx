import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import PageHeader from "@/components/layout/PageHeader";
import Alert from "@/components/ui/Alert";
import PjView from "@/components/PjView";

export default async function PjDashboard() {
  const user = await getSessionUser();
  if (!user || user.role !== "PJ") {
    redirect("/pj/login");
  }

  if (!user.companyId) {
    return (
      <>
        <PageHeader
          title="Empresa"
          description="Gestão de contrato, beneficiários e faturas corporativas."
        />
        <Alert tone="danger">
          Sua conta não está vinculada a nenhuma empresa. Contate o suporte para
          concluir a configuração do acesso corporativo.
        </Alert>
      </>
    );
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
