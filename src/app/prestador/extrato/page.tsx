import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import PageHeader from "@/components/layout/PageHeader";
import PrestadorExtratoView from "@/components/PrestadorExtratoView";

export default async function PrestadorExtratoPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "PRESTADOR") redirect("/login");

  return (
    <>
      <PageHeader
        title="Extrato"
        description="Procedimentos realizados e valores gerados no período."
      />
      <PrestadorExtratoView />
    </>
  );
}
