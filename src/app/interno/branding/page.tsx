import PageHeader from "@/components/layout/PageHeader";
import BrandingView from "@/components/BrandingView";
import { requireInternoPage } from "@/lib/interno-guard";

export default async function InternoBrandingPage() {
  await requireInternoPage("branding");

  return (
    <>
      <PageHeader title="White Label" description="Identidade visual, logo e domínio customizado." />
      <BrandingView />
    </>
  );
}
