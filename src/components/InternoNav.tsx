import Link from "next/link";

const links = [
  { href: "/interno", label: "Faturamento" },
  { href: "/interno/crm", label: "CRM Corporativo" },
];

export default function InternoNav({ active }: { active: "billing" | "crm" }) {
  return (
    <nav className="mt-6 flex gap-2 border-b border-slate-200">
      {links.map((link) => {
        const isActive =
          (active === "billing" && link.href === "/interno") ||
          (active === "crm" && link.href === "/interno/crm");
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition ${
              isActive
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
