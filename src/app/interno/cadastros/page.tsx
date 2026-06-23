import { Suspense } from "react";
import InternoCadastrosHeader from "@/components/interno/InternoCadastrosHeader";
import CadastrosView from "@/components/CadastrosView";
import LoadingState from "@/components/ui/LoadingState";
import { requireInternoPage } from "@/lib/interno-guard";

export default async function InternoCadastrosPage() {
  await requireInternoPage("cadastros");

  return (
    <>
      <InternoCadastrosHeader />
      <Suspense fallback={<LoadingState message="Carregando cadastros..." />}>
        <CadastrosView />
      </Suspense>
    </>
  );
}
