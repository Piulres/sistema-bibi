import LoginForm from "@/components/LoginForm";

export default function BeneficiarioLoginPage() {
  return (
    <LoginForm
      portal="beneficiario"
      title="Portal do Beneficiário"
      subtitle="Acompanhe agenda, consumo Pay Per Use, faturas e assinatura."
      accent="from-teal-500 to-cyan-600"
      demoEmail="joao.pereira@email.com"
      demoPassword="bibi123"
    />
  );
}
