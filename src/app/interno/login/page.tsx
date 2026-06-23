import LoginForm from "@/components/LoginForm";
import { getLoginBrandingFromHeaders } from "@/lib/theme/branding";
import { NICHE_INTERNO_DEMOS } from "@/lib/niche/demo-accounts";

export default async function InternoLoginPage() {
  const branding = await getLoginBrandingFromHeaders();

  return (
    <LoginForm
      portal="interno"
      title="Portal Interno"
      subtitle="Administre operação e faturamento. No ServiceOS v2.0, cada tenant usa o vocabulário do seu nicho."
      demoEmail="faturamento@bibi.health"
      demoPassword="bibi123"
      branding={branding}
      nicheDemos={NICHE_INTERNO_DEMOS}
    />
  );
}
