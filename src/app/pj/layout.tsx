import { getSessionUser } from "@/lib/session";
import { isAssistantEnabled } from "@/lib/assistant/config";
import PjPortalShell from "@/components/layout/PjPortalShell";

export const dynamic = "force-dynamic";

export default async function PjLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  return (
    <PjPortalShell user={user} assistantEnabled={isAssistantEnabled()}>
      {children}
    </PjPortalShell>
  );
}
