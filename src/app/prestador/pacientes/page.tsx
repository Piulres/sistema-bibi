import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import PrestadorPatientsView from "@/components/PrestadorPatientsView";

export default async function PrestadorPacientesPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "PRESTADOR") {
    redirect("/login");
  }

  return <PrestadorPatientsView />;
}
