import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import PortalHeader from "@/components/PortalHeader";
import PatientOverviewView from "@/components/PatientOverviewView";

export default async function PatientOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user || user.role !== "INTERNO") {
    redirect("/interno/login");
  }

  const { id } = await params;

  return (
    <div className="flex-1">
      <PortalHeader
        portalLabel="Portal Interno"
        tenantName={user.tenantName}
        userName={user.name}
        loginPath="/interno/login"
      />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <PatientOverviewView patientId={id} />
      </main>
    </div>
  );
}
