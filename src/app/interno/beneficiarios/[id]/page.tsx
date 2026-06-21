import { PORTALS } from "@/lib/roles";
import PortalShell from "@/components/layout/PortalShell";
import InternoNav from "@/components/InternoNav";
import PatientOverviewView from "@/components/PatientOverviewView";
import { requireInternoPage } from "@/lib/interno-guard";

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
  "/interno/integracoes": "Voltar às integrações",
};

export default async function PatientOverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const user = await requireInternoPage();

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
      <InternoNav permissions={user.internoPermissions} />
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
