import PageHeader from "@/components/layout/PageHeader";
import IntegracoesView from "@/components/IntegracoesView";
import { requireInternoPage } from "@/lib/interno-guard";

export default async function IntegracoesPage() {
  await requireInternoPage("integracoes");

  return (
    <>
      <PageHeader
        title="Integrações B2B"
        description="Webhooks outbound para ERPs, folha de pagamento e parceiros corporativos."
      />
      <IntegracoesView />
    </>
  );
}
