import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { PORTALS } from "@/lib/roles";
import PortalShell from "@/components/layout/PortalShell";
import InternoNav from "@/components/InternoNav";
import PatientOverviewView from "@/components/PatientOverviewView";

const RETURN_LABELS: Record<string, string> = {
  "/interno/dashboard": "Voltar ao dashboard",
  "/interno": "Voltar ao faturamento",
  "/interno/cadastros": "Voltar aos cadastros",
  "/interno/agenda": "Voltar à agenda",
  "/interno/crm": "Voltar ao CRM",
  "/interno/assinaturas": "Voltar à recorrência",
  "/interno/comunicacao": "Voltar à comunicação",
  "/interno/relatorios": "Voltar aos relatórios",
  "/interno/branding": "Voltar ao white label",
};

export default async function PatientOverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const user = await getSessionUser();
  if (!user || user.role !== "INTERNO") {
    redirect("/interno/login");
  }

  const { id } = await params;
  const { from } = await searchParams;
  const returnTo = from && RETURN_LABELS[from] ? from : "/interno";
  const returnLabel = RETURN_LABELS[returnTo] ?? "Voltar ao faturamento";

  const portal = PORTALS.interno;

  return (
    <PortalShell
      portal="interno"
      portalLabel={portal.label}
      loginPath={portal.loginPath}
      userName={user.name}
      branding={user.branding}
    >
      <InternoNav />
      <div className="mt-8">
        <PatientOverviewView
          patientId={id}
          returnTo={returnTo}
          returnLabel={returnLabel}
        />
      </div>
    </PortalShell>
  );
}
