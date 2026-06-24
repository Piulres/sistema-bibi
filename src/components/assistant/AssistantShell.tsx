"use client";

import { usePathname } from "next/navigation";
import AssistantProvider from "@/components/assistant/AssistantProvider";
import AssistantPanel from "@/components/assistant/AssistantPanel";
import AssistantTrigger from "@/components/assistant/AssistantTrigger";

type Props = {
  children: React.ReactNode;
};

/** Envolve o portal interno com provider + painel + trigger do assistente. */
export default function AssistantShell({ children }: Props) {
  const pathname = usePathname();

  return (
    <AssistantProvider pageContext={pathname}>
      {children}
      <AssistantTrigger />
      <AssistantPanel />
    </AssistantProvider>
  );
}
