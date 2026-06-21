import LoginForm from "@/components/LoginForm";
import { getPlatformBranding } from "@/lib/theme/branding";

export default async function PrestadorLoginPage() {
  const branding = await getPlatformBranding();

  return (
    <LoginForm
      portal="prestador"
      title="Portal do Prestador"
      subtitle="Acesso a agenda e prontuário eletrônico."
      demoEmail="dra.helena@bibi.health"
      demoPassword="bibi123"
      branding={branding}
    />
  );
}
