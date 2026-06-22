import PageHeader from "@/components/layout/PageHeader";
import BillingView from "@/components/BillingView";
import { requireInternoPage } from "@/lib/interno-guard";

export default async function InternoBillingPage() {
  await requireInternoPage("billing");

  return (
    <>
      <PageHeader
        title="Faturamento"
        description="Controle financeiro e geração de faturas Pay Per Use."
      />
      <BillingView />
    </>
  );
}
