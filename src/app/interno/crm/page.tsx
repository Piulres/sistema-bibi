import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import PortalHeader from "@/components/PortalHeader";
import InternoNav from "@/components/InternoNav";
import CrmPipelineView from "@/components/CrmPipelineView";

export default async function InternoCrmPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "INTERNO") {
    redirect("/interno/login");
  }

  return (
    <div className="flex-1">
      <PortalHeader
        portalLabel="Portal Interno"
        tenantName={user.tenantName}
        userName={user.name}
        loginPath="/interno/login"
      />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <h1 className="text-2xl font-bold text-slate-900">CRM Corporativo</h1>
        <p className="mt-1 text-slate-600">
          Pipeline de empresas contratantes — do lead ao contrato ativo.
        </p>
        <InternoNav active="crm" />
        <div className="mt-8">
          <CrmPipelineView />
        </div>
      </main>
    </div>
  );
}
