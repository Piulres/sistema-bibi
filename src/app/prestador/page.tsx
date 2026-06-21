import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import PortalHeader from "@/components/PortalHeader";
import AgendaView from "@/components/AgendaView";

export default async function PrestadorDashboard() {
  const user = await getSessionUser();
  if (!user || user.role !== "PRESTADOR") {
    redirect("/login");
  }

  return (
    <div className="flex-1">
      <PortalHeader
        portalLabel="Portal do Prestador"
        tenantName={user.tenantName}
        userName={user.name}
        loginPath="/login"
      />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Bem-vinda, {user.name}
        </h1>
        <p className="mt-1 text-slate-600">
          Sua agenda do dia e acesso rápido ao prontuário eletrônico.
        </p>
        <div className="mt-8">
          <AgendaView />
        </div>
      </main>
    </div>
  );
}
