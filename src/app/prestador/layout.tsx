import { getSessionUser } from "@/lib/session";
import PrestadorPortalShell from "@/components/layout/PrestadorPortalShell";

export default async function PrestadorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  return <PrestadorPortalShell user={user}>{children}</PrestadorPortalShell>;
}
