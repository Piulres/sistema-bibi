import PageHeader from "@/components/layout/PageHeader";
import AssistenteConfigView from "@/components/AssistenteConfigView";
import { requireInternoPage } from "@/lib/interno-guard";

export default async function AssistentePage() {
  await requireInternoPage("assistente");

  return (
    <>
      <PageHeader
        title="Regras do assistente"
        description="Configurações do chat operacional — regras por nicho, flag de IA e inventário de ferramentas."
      />
      <AssistenteConfigView />
    </>
  );
}
