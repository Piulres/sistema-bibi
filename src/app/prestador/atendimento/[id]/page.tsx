import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import PortalHeader from "@/components/PortalHeader";
import AtendimentoView from "@/components/AtendimentoView";

export default async function AtendimentoPage(
  props: PageProps<"/prestador/atendimento/[id]">,
) {
  const user = await getSessionUser();
  if (!user || user.role !== "PRESTADOR") {
    redirect("/login");
  }
  const { id } = await props.params;

  return (
    <div className="flex-1">
      <PortalHeader
        portalLabel="Portal do Prestador"
        tenantName={user.tenantName}
        userName={user.name}
        loginPath="/login"
      />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <AtendimentoView appointmentId={id} />
      </main>
    </div>
  );
}
