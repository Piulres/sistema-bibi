import LoginForm from "@/components/LoginForm";
import { getPlatformBranding } from "@/lib/theme/branding";

export default async function InternoLoginPage() {
  const branding = await getPlatformBranding();

  return (
    <LoginForm
      portal="interno"
      title="Portal Interno"
      subtitle="Faturamento Pay Per Use e administração."
      demoEmail="faturamento@bibi.health"
      demoPassword="bibi123"
      branding={branding}
    />
  );
}
