import { redirect } from "next/navigation";

/** Alias legado — faturamento interno fica em `/interno`. */
export default function InternoFaturamentoRedirect() {
  redirect("/interno");
}
