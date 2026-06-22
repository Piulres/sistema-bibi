import PageHeader from "@/components/layout/PageHeader";
import AuditoriaView from "@/components/AuditoriaView";
import { requireInternoPage } from "@/lib/interno-guard";

export default async function InternoAuditoriaPage() {
  await requireInternoPage("auditoria");

  return (
    <>
      <PageHeader
        title="Auditoria"
        description="Linha do tempo universal de eventos do tenant — rastreabilidade operacional e financeira."
      />
      <AuditoriaView />
    </>
  );
}
