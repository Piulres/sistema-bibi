import { getSessionUser } from "@/lib/session";
import { isAssistantEnabled } from "@/lib/assistant/config";
import PrestadorPortalShell from "@/components/layout/PrestadorPortalShell";

export const dynamic = "force-dynamic";

export default async function PrestadorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  return (
    <PrestadorPortalShell user={user} assistantEnabled={isAssistantEnabled()}>
      {children}
    </PrestadorPortalShell>
  );
}
