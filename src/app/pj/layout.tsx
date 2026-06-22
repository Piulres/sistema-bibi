import { getSessionUser } from "@/lib/session";
import PjPortalShell from "@/components/layout/PjPortalShell";

export default async function PjLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  return <PjPortalShell user={user}>{children}</PjPortalShell>;
}
