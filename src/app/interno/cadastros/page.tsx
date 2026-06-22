import { Suspense } from "react";
import PageHeader from "@/components/layout/PageHeader";
import CadastrosView from "@/components/CadastrosView";
import LoadingState from "@/components/ui/LoadingState";
import { requireInternoPage } from "@/lib/interno-guard";

export default async function InternoCadastrosPage() {
  await requireInternoPage("cadastros");

  return (
    <>
      <PageHeader
        title="Cadastros"
        description="Beneficiários, empresas, procedimentos e usuários do tenant."
      />
      <Suspense fallback={<LoadingState message="Carregando cadastros..." />}>
        <CadastrosView />
      </Suspense>
    </>
  );
}
