import Link from "next/link";

const links = [
  { href: "/interno/dashboard", label: "Dashboard", key: "dashboard" as const },
  { href: "/interno", label: "Faturamento", key: "billing" as const },
  { href: "/interno/crm", label: "CRM Corporativo", key: "crm" as const },
  { href: "/interno/assinaturas", label: "Recorrência", key: "subscriptions" as const },
  { href: "/interno/comunicacao", label: "Comunicação", key: "comunicacao" as const },
];

export default function InternoNav({
  active,
}: {
  active: "dashboard" | "billing" | "crm" | "subscriptions" | "comunicacao";
}) {
  return (
    <nav className="mt-6 flex gap-2 overflow-x-auto border-b border-slate-200">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`-mb-px shrink-0 border-b-2 px-4 py-2 text-sm font-medium transition ${
            active === link.key
              ? "border-indigo-600 text-indigo-700"
              : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
