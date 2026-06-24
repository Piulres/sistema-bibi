import { getSessionUser } from "@/lib/session";
import { isAssistantEnabled } from "@/lib/assistant/config";
import BeneficiarioPortalShell from "@/components/layout/BeneficiarioPortalShell";

export const dynamic = "force-dynamic";

export default async function BeneficiarioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  return (
    <BeneficiarioPortalShell user={user} assistantEnabled={isAssistantEnabled()}>
      {children}
    </BeneficiarioPortalShell>
  );
}
