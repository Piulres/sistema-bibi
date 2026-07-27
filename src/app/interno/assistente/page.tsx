import PageHeader from "@/components/layout/PageHeader";
import AssistenteConfigView from "@/components/AssistenteConfigView";
import { requireInternoPage } from "@/lib/interno-guard";

export default async function AssistentePage() {
  await requireInternoPage("assistente");

  return (
    <>
      <PageHeader
        title="Assistente"
        description="Configurações do assistente operacional — regras por nicho, flag de IA e matriz de fluxos."
      />
      <AssistenteConfigView />
    </>
  );
}
