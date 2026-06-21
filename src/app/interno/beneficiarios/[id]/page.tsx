import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import PortalHeader from "@/components/PortalHeader";
import InternoNav from "@/components/InternoNav";
import PatientOverviewView from "@/components/PatientOverviewView";

const RETURN_LABELS: Record<string, string> = {
  "/interno/dashboard": "Voltar ao dashboard",
  "/interno": "Voltar ao faturamento",
  "/interno/crm": "Voltar ao CRM",
  "/interno/assinaturas": "Voltar à recorrência",
  "/interno/comunicacao": "Voltar à comunicação",
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

  return (
    <div className="flex-1">
      <PortalHeader
        portalLabel="Portal Interno"
        tenantName={user.tenantName}
        userName={user.name}
        loginPath="/interno/login"
      />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <InternoNav />
        <div className="mt-8">
          <PatientOverviewView
            patientId={id}
            returnTo={returnTo}
            returnLabel={returnLabel}
          />
        </div>
      </main>
    </div>
  );
}
