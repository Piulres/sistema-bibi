# Design System & White Label — Sistema Bibi - ServiceOS

Plataforma visual unificada com identidade configurável por tenant (white label)
e **vocabulário dinâmico por nicho** (`useLabels()`).

> **Escopo v2.0:** [`V2_0.md`](V2_0.md) · **Arquitetura:** [`V2_0_ARCHITECTURE.md`](V2_0_ARCHITECTURE.md)

> Fluxos de administração de branding: [`FLUXOS.md`](../produto/FLUXOS.md) §4 (módulo `branding`).

## Visão geral

O design system separa **quatro camadas**:

1. **Tokens globais** (`src/app/globals.css`) — superfícies, texto, bordas, status e variáveis de marca.
2. **Branding por tenant** (`TenantBranding` + `TenantTheme`) — cores, nome de exibição, tagline e logo injetados em runtime via CSS variables.
3. **Tema por portal** (`src/lib/theme/portals.ts`) — acentos visuais dos quatro portais (Prestador, Interno, PJ, Beneficiário).
4. **Labels por nicho** (`useLabels()` + `NICHE_MASTER_LABELS`) — texto da UI ("Paciente" → "Pet", "Cliente", "Aluno").

## Modelo de dados

```prisma
model TenantBranding {
  displayName    String   // Nome comercial na UI
  tagline        String?
  logoUrl        String?
  primaryColor   String   // hex #RRGGBB
  accentColor    String
  heroFrom       String   // gradiente do hero
  heroTo         String
  platformLabel  String   // ex. "Powered by Sistema Bibi - ServiceOS"
  colorScheme    String   // light | dark | system
  customDomain   String?  // ex. saude.cliente.com.br (Tier 3)
  customDomainVerified Boolean
}
```

Relação 1:1 com `Tenant`. O seed cria dois tenants demo:

- **Clínica Horizonte** — clínica cliente demo (teal)
- **VitaCare** — white label corporativo (azul)

**Sistema Bibi - ServiceOS** é a marca da **plataforma** (landing/marketing), não de um tenant. Ver `PLATFORM_BRANDING` em `src/lib/theme/tokens.ts` e `PLATFORM` em `src/lib/platform.ts`.

## Tokens CSS

| Variável | Uso |
|----------|-----|
| `--brand-primary` | Botões primários, links de marca |
| `--brand-accent` | CTAs, destaques |
| `--brand-hero-from/to` | Hero da landing e avatar fallback |
| `--portal-accent` | Navegação e acentos do portal atual |
| `--surface-*` | Fundos de página, cards e áreas muted |
| `--text-*` | Hierarquia tipográfica |
| `--status-*` | Badges de status (sucesso, alerta, etc.) |

## Componentes UI

Localizados em `src/components/ui/`:

| Componente | Descrição |
|------------|-----------|
| `Button` | Variantes: primary, secondary, portal, ghost, danger |
| `Input` | Campo com label e focus ring semântico |
| `Card` | Container padrão (`.ds-card`) |
| `Badge` | Pill de status com tons semânticos |
| `Alert` | Mensagens info/success/warning/danger |
| `NavTabs` | Navegação horizontal entre rotas — `ScrollableNavRail` (`aria-label="Navegação por abas"`) |
| `Breadcrumbs` | Trilha hierárquica (`Cliente 360°`, atendimento prestador) |
| `SectionNav` | Âncoras PJ/beneficiário — drawer abaixo de lg + faixa rolável |
| `ScrollableNavRail` | Scroll horizontal com gradientes e setas quando transborda |
| `StatCard` | KPI com label, valor, hint e tom semântico (`warning`, `success`, `accent`…) |
| `CalloutCard` | Destaque com borda lateral — walk-in, info, success |
| `FlowStepper` | Progresso da jornada clínica (Agendado → Pago) |
| `AppointmentCard` | Card de consulta com horário, status e faixa lateral por estado |
| `TabBar` | Abas client-side com sublinhado (ex.: Cadastros) |

Jornada visual: `src/lib/care-journey.ts` + `FlowStepper` no beneficiário e walk-in da agenda.

## Layout

| Componente | Descrição |
|------------|-----------|
| `TenantTheme` | Injeta CSS variables no subtree |
| `PortalShell` | Header + main padronizado para portais autenticados |
| `PageHeader` | Título + descrição de página |
| `InternoPortalShell` / `PrestadorPortalShell` / `PjPortalShell` / `BeneficiarioPortalShell` | Shell client-side persistente por portal (em `layout.tsx`) |
| `InternoNav` | Abas internas + `MobileNavDrawer` abaixo de **lg** (1024px) |
| `MobileNavDrawer` | Drawer de rotas (interno) |
| `MobileSectionDrawer` | Drawer de seções (PJ, beneficiário) |
| `NavigationProgress` | Barra de progresso no topo durante troca de rota |
| `LandingMobileMenu` | Menu hamburger da landing |

Config de menus e rótulos: `src/lib/navigation/routes.ts`.

## Uso em páginas

```tsx
// Portal interno — shell e nav vivem no layout; a page só declara conteúdo
export default async function InternoBillingPage() {
  await requireInternoPage("billing");
  return (
    <>
      <PageHeader title="Faturamento" description="..." />
      <BillingView />
    </>
  );
}

// Landing / marketing — identidade da plataforma (Sistema Bibi - ServiceOS)
const branding = getPlatformBranding();

// Login público — tenant por domínio ou shell "Portal da clínica"
const loginBranding = await getLoginBrandingFromHeaders();

// Portais autenticados — branding vem de getSessionUser().branding
```

## Status badges

Mapas reutilizáveis em `src/lib/theme/status-styles.ts`:

- `appointmentStatusClass`
- `invoiceStatusClass`
- `companyStatusClass`
- `timelineActionClass`

Preferir `Badge` ou `statusBadgeClass(map, value)` em novas telas.

## White label na prática

Três camadas (v1.0.2+):

| Camada | Função | API / token |
|--------|--------|-------------|
| Plataforma | Site comercial, vende o produto | `getPlatformBranding()` → `PLATFORM_BRANDING` |
| Login | Entrada genérica ou por domínio customizado | `getLoginBrandingFromHeaders()` |
| Tenant | Dados e marca da clínica cliente | `getSessionUser().branding` |

1. Cada tenant possui registro `TenantBranding`.
2. Após login, `getSessionUser()` retorna `user.branding`.
3. `PortalHeader` exibe logo/nome do tenant e faixa `{platformLabel} · white label`.
4. Cores são aplicadas via `TenantTheme` sem rebuild do front-end.

## Administração de branding (Portal Interno)

Rota: **`/interno/branding`** (aba **White Label** na navegação interna).

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/interno/branding` | GET | Retorna branding do tenant logado |
| `/api/interno/branding` | PUT | Upsert de identidade visual |
| `/api/interno/branding/logo` | POST | Upload de logo (Netlify Blobs ou disco local em dev) |
| `/api/branding/logo/[tenantId]` | GET | Serve logo público do tenant |

**Presets** disponíveis em `src/lib/theme/presets.ts` (Bibi, VitaCare, Amethyst, Forest).

**Storage de logo** (`src/lib/storage/tenant-logo.ts`):
- **Netlify (produção):** store `bibi-tenant-logos` via `@netlify/blobs`
- **Dev local:** fallback em `public/tenant-logos/` (gitignored)
- URL persistida: `/api/branding/logo/{tenantId}?v=...`
- Headers: `Cache-Tag: tenant-logo-{tenantId}` para purge on-demand

**Tema escuro (`colorScheme`):** `light` | `dark` | `system` — aplicado via `data-theme` em `TenantTheme`. Superfícies e status adaptam-se em `globals.css`.

**Domínio customizado (`customDomain`):** configurável em `/interno/branding` (Tier 3). Resolução via `src/lib/tenant-resolver.ts`; verificação manual na POC (sem challenge DNS automático).

**Validação** em `src/lib/theme/branding-validation.ts` (cores hex, URL/data URL do logo).

## Labels por nicho (v2.0)

Complementa o white label visual com **vocabulário do setor**:

| Nicho | Cor primária | Exemplo `labels.patient` |
|-------|--------------|--------------------------|
| MEDICAL | `#2563eb` | Paciente |
| VET | `#059669` | Pet |
| DENTAL | `#0891b2` | Paciente |
| LEGAL | `#475569` | Cliente |
| SPA | `#a78bfa` | Cliente |
| EDUCATION | `#d97706` | Aluno |

- Defaults: `src/lib/niche/defaults.ts` + `src/constants/niches.ts`
- Hook: `useLabels()` em componentes client — **nunca** hardcodar "Paciente" em novas telas
- Paleta automática: `applyNicheBrandingDefaults()` quando tenant usa cores padrão teal
- Landing: `nicheLandingBranding()` em `src/lib/niche/branding.ts`

## Componentes auxiliares

| Componente | Uso |
|------------|-----|
| `StatusBadge` | Badges de status com mapas semânticos |
| `SectionHeader` | Título + descrição de seção |
| `LoadingState` / `EmptyState` | Estados de carregamento e vazio |

## Próximos passos sugeridos

- Purge de cache CDN via `Cache-Tag: tenant-logo-{tenantId}` após troca de logo (Netlify)
- Verificação automática de domínio custom (DNS TXT/CNAME)
- Paleta de superfície customizável por tenant (além de light/dark/system)
