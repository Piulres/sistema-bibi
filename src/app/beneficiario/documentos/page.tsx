import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import PageHeader from "@/components/layout/PageHeader";
import BeneficiarioView from "@/components/BeneficiarioView";

export default async function BeneficiarioDocumentosPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "BENEFICIARIO" || !user.patientId) {
    redirect("/beneficiario/login");
  }

  return (
    <>
      <PageHeader
        title="Meus documentos"
        description="Receitas, pedidos de exame, encaminhamentos e atestados para baixar ou apresentar."
      />
      <BeneficiarioView section="documentos" />
    </>
  );
}
