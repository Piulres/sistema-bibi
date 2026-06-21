import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import PortalHeader from "@/components/PortalHeader";
import BeneficiarioView from "@/components/BeneficiarioView";

export default async function BeneficiarioDashboard() {
  const user = await getSessionUser();
  if (!user || user.role !== "BENEFICIARIO") {
    redirect("/beneficiario/login");
  }
  if (!user.patientId) {
    redirect("/beneficiario/login");
  }

  return (
    <div className="flex-1">
      <PortalHeader
        portalLabel="Portal do Beneficiário"
        tenantName={user.tenantName}
        userName={user.name}
        loginPath="/beneficiario/login"
      />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-2xl font-bold text-slate-900">Olá, {user.patientName ?? user.name}</h1>
        <p className="mt-1 text-slate-600">
          Acompanhe seus atendimentos, consumo e faturamento com transparência.
        </p>
        <div className="mt-8">
          <BeneficiarioView />
        </div>
      </main>
    </div>
  );
}
