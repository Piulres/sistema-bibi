import { getSessionUser } from "@/lib/session";
import BeneficiarioPortalShell from "@/components/layout/BeneficiarioPortalShell";

export default async function BeneficiarioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  return <BeneficiarioPortalShell user={user}>{children}</BeneficiarioPortalShell>;
}
