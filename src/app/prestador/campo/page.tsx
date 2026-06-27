import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import PageHeader from "@/components/layout/PageHeader";
import PrestadorCampoView from "@/components/projects/PrestadorCampoView";

export default async function PrestadorCampoPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "PRESTADOR") {
    redirect("/login");
  }
  if (user.niche !== "CONSTRUCTION") {
    redirect("/prestador");
  }

  return (
    <>
      <PageHeader
        title="Campo"
        description="Registro diário de obra — presença, execução, fotos e diárias."
      />
      <PrestadorCampoView />
    </>
  );
}
