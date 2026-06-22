import PageHeader from "@/components/layout/PageHeader";
import CrmPipelineView from "@/components/CrmPipelineView";
import { requireInternoPage } from "@/lib/interno-guard";

export default async function InternoCrmPage() {
  await requireInternoPage("crm");

  return (
    <>
      <PageHeader
        title="CRM Corporativo"
        description="Pipeline de empresas e oportunidades B2B."
      />
      <CrmPipelineView />
    </>
  );
}
