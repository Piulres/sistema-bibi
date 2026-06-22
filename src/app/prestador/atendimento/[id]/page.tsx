import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import AtendimentoView from "@/components/AtendimentoView";

export default async function AtendimentoPage(
  props: PageProps<"/prestador/atendimento/[id]">,
) {
  const user = await getSessionUser();
  if (!user || user.role !== "PRESTADOR") {
    redirect("/login");
  }
  const { id } = await props.params;

  return <AtendimentoView appointmentId={id} />;
}
