import PageHeader from "@/components/layout/PageHeader";
import ComunicacaoView from "@/components/ComunicacaoView";
import { requireInternoPage } from "@/lib/interno-guard";

export default async function InternoComunicacaoPage() {
  await requireInternoPage("comunicacao");

  return (
    <>
      <PageHeader
        title="Comunicação"
        description="Campanhas e mensagens para beneficiários e empresas."
      />
      <ComunicacaoView />
    </>
  );
}
