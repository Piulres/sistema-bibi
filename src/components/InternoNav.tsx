import NavTabs, { type NavTab } from "@/components/ui/NavTabs";
import { PORTAL_THEMES } from "@/lib/theme/portals";

const tabs: NavTab[] = [
  { href: "/interno/dashboard", label: "Dashboard", key: "dashboard" },
  { href: "/interno", label: "Faturamento", key: "billing" },
  { href: "/interno/crm", label: "CRM Corporativo", key: "crm" },
  { href: "/interno/assinaturas", label: "Recorrência", key: "subscriptions" },
  { href: "/interno/comunicacao", label: "Comunicação", key: "comunicacao" },
  { href: "/interno/branding", label: "White Label", key: "branding" },
];

export default function InternoNav({
  active,
}: {
  active?:
    | "dashboard"
    | "billing"
    | "crm"
    | "subscriptions"
    | "comunicacao"
    | "branding";
}) {
  const theme = PORTAL_THEMES.interno;
  return (
    <NavTabs
      tabs={tabs}
      active={active}
      activeClass={theme.navActiveClass}
      idleClass={theme.navIdleClass}
    />
  );
}
