import NavTabs, { type NavTab } from "@/components/ui/NavTabs";
import { PORTAL_THEMES } from "@/lib/theme/portals";
import type { InternoModule } from "@/lib/interno-permissions";

const allTabs: NavTab[] = [
  { href: "/interno/dashboard", label: "Dashboard", key: "dashboard" },
  { href: "/interno", label: "Faturamento", key: "billing" },
  { href: "/interno/agenda", label: "Agenda", key: "agenda" },
  { href: "/interno/cadastros", label: "Cadastros", key: "cadastros" },
  { href: "/interno/crm", label: "CRM Corporativo", key: "crm" },
  { href: "/interno/assinaturas", label: "Recorrência", key: "subscriptions" },
  { href: "/interno/comunicacao", label: "Comunicação", key: "comunicacao" },
  { href: "/interno/relatorios", label: "Relatórios", key: "relatorios" },
  { href: "/interno/branding", label: "White Label", key: "branding" },
  { href: "/interno/integracoes", label: "Integrações", key: "integracoes" },
];

export default function InternoNav({
  active,
  permissions,
}: {
  active?: InternoModule;
  permissions?: InternoModule[];
}) {
  const theme = PORTAL_THEMES.interno;
  const tabs =
    permissions && permissions.length > 0
      ? allTabs.filter((tab) => permissions.includes(tab.key as InternoModule))
      : allTabs;

  return (
    <NavTabs
      tabs={tabs}
      active={active}
      activeClass={theme.navActiveClass}
      idleClass={theme.navIdleClass}
    />
  );
}
