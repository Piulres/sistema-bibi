"use client";

import { usePathname } from "next/navigation";
import AssistantProvider from "@/components/assistant/AssistantProvider";
import AssistantPanel from "@/components/assistant/AssistantPanel";
import AssistantTrigger from "@/components/assistant/AssistantTrigger";
import type { PortalKey } from "@/lib/roles";

type Props = {
  portal: PortalKey;
  /** Desliga UI quando ASSISTANT_ENABLED=false no servidor (dev/prod). */
  enabled?: boolean;
  children: React.ReactNode;
};

/** Envolve portal autenticado com provider + painel + trigger do assistente. */
export default function AssistantShell({ portal, enabled = true, children }: Props) {
  const pathname = usePathname();

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <AssistantProvider pageContext={pathname}>
      {children}
      <AssistantTrigger />
      <AssistantPanel portal={portal} />
    </AssistantProvider>
  );
}
