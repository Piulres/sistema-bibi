import { getSessionUser } from "@/lib/session";
import { isAssistantEnabled } from "@/lib/assistant/config";
import InternoPortalShell from "@/components/layout/InternoPortalShell";

export const dynamic = "force-dynamic";

export default async function InternoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  return (
    <InternoPortalShell user={user} assistantEnabled={isAssistantEnabled()}>
      {children}
    </InternoPortalShell>
  );
}
