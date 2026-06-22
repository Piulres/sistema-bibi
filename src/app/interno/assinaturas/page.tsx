import PageHeader from "@/components/layout/PageHeader";
import SubscriptionsView from "@/components/SubscriptionsView";
import { requireInternoPage } from "@/lib/interno-guard";

export default async function InternoSubscriptionsPage() {
  await requireInternoPage("subscriptions");

  return (
    <>
      <PageHeader
        title="Recorrência"
        description="Assinaturas e cobranças recorrentes dos beneficiários."
      />
      <SubscriptionsView />
    </>
  );
}
