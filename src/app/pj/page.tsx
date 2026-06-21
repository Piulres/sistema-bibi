import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import PortalHeader from "@/components/PortalHeader";
import PjView from "@/components/PjView";

export default async function PjDashboard() {
  const user = await getSessionUser();
  if (!user || user.role !== "PJ") {
    redirect("/pj/login");
  }

  return (
    <div className="flex-1">
      <PortalHeader
        portalLabel="Portal da Empresa (PJ)"
        tenantName={user.tenantName}
        userName={user.name}
        loginPath="/pj/login"
      />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-2xl font-bold text-slate-900">
          {user.companyName ?? "Empresa"}
        </h1>
        <p className="mt-1 text-slate-600">
          Gestão de contrato, beneficiários e faturas corporativas.
        </p>
        <div className="mt-8">
          <PjView />
        </div>
      </main>
    </div>
  );
}
