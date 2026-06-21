import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import PortalHeader from "@/components/PortalHeader";
import InternoNav from "@/components/InternoNav";
import ComunicacaoView from "@/components/ComunicacaoView";

export default async function ComunicacaoPage() {
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
      <main className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-2xl font-bold text-slate-900">Comunicação</h1>
        <p className="mt-1 text-slate-600">
          Enfileire lembretes e notificações por e-mail, SMS ou WhatsApp.
        </p>
        <InternoNav active="comunicacao" />
        <div className="mt-8">
          <ComunicacaoView />
        </div>
      </main>
    </div>
  );
}
