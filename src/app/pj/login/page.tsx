import LoginForm from "@/components/LoginForm";

export default function PjLoginPage() {
  return (
    <LoginForm
      portal="pj"
      title="Portal da Empresa (PJ)"
      subtitle="Gestão de contratos e beneficiários corporativos."
      accent="from-fuchsia-500 to-purple-600"
      demoEmail="rh@techcorp.com"
      demoPassword="bibi123"
    />
  );
}
