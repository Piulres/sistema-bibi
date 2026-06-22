import { getSessionUser } from "@/lib/session";
import InternoPortalShell from "@/components/layout/InternoPortalShell";

export const dynamic = "force-dynamic";

export default async function InternoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  return <InternoPortalShell user={user}>{children}</InternoPortalShell>;
}
