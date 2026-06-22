import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import PrestadorPatientHistoryView from "@/components/PrestadorPatientHistoryView";

export default async function PrestadorPacientePage(
  props: PageProps<"/prestador/paciente/[id]">,
) {
  const user = await getSessionUser();
  if (!user || user.role !== "PRESTADOR") {
    redirect("/login");
  }
  const { id } = await props.params;

  return <PrestadorPatientHistoryView patientId={id} />;
}
