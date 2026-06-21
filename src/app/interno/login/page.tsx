import LoginForm from "@/components/LoginForm";

export default function InternoLoginPage() {
  return (
    <LoginForm
      portal="interno"
      title="Portal Interno"
      subtitle="Faturamento Pay Per Use e administração."
      accent="from-indigo-500 to-blue-600"
      demoEmail="faturamento@bibi.health"
      demoPassword="bibi123"
    />
  );
}
