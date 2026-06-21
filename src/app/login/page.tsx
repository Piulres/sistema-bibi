import LoginForm from "@/components/LoginForm";

export default function PrestadorLoginPage() {
  return (
    <LoginForm
      portal="prestador"
      title="Portal do Prestador"
      subtitle="Acesso a agenda e prontuário eletrônico."
      accent="from-teal-500 to-emerald-600"
      demoEmail="dra.helena@bibi.health"
      demoPassword="bibi123"
    />
  );
}
