# Design System & White Label — Sistema Bibi

Plataforma visual unificada com identidade configurável por tenant (white label).

> Fluxos de administração de branding: [`FLUXOS.md`](FLUXOS.md) §4 (módulo `branding`).

## Visão geral

O design system separa quatro camadas:

1. **Tokens globais** (`src/app/globals.css`) — superfícies, texto, bordas, status e variáveis de marca.
2. **Identidade da plataforma** (`PLATFORM_BRANDING` em `src/lib/theme/tokens.ts`) — marca **Sistema Bibi** em landing e páginas comerciais; não lê banco.
3. **Branding por tenant** (`TenantBranding` + `TenantTheme`) — cores, nome de exibição, tagline e logo da **clínica cliente** injetados em runtime via CSS variables.
4. **Tema por portal** (`src/lib/theme/portals.ts`) — acentos visuais dos quatro portais (Prestador, Interno, PJ, Beneficiário).

## Identidade: plataforma vs tenant clínico

O produto distingue **vendor** (Sistema Bibi) de **cliente** (cada clínica/operadora tenant). Três conjuntos de tokens em `src/lib/theme/tokens.ts`:

| Constante | Onde aparece | `displayName` típico | `platformLabel` |
|-----------|--------------|----------------------|-----------------|
| `PLATFORM_BRANDING` | Landing `/`, metadata comercial | Sistema Bibi | Plataforma SaaS HealthTech |
| `LOGIN_PORTAL_BRANDING` | Logins sem domínio custom resolvido | Portal da clínica | Powered by Sistema Bibi |
| `CLINIC_BRANDING_DEFAULTS` | Fallback de tenant sem registro `TenantBranding` | Nome do tenant no banco | Powered by Sistema Bibi |

**APIs** (`src/lib/theme/branding.ts`):

| Função | Uso | Banco? |
|--------|-----|--------|
| `getPlatformBranding()` | Landing e marketing | Não (síncrono) |
| `getLoginBranding(host)` / `getLoginBrandingFromHeaders()` | Páginas `/login`, `/interno/login`, `/pj/login`, `/beneficiario/login` | Só se `Host` resolve tenant via domínio custom |
| `getTenantBranding(tenantId)` | Admin branding, resolução por domínio | Sim |
| `getSessionUser().branding` | Portais autenticados pós-login | Sim (tenant da sessão) |

**Resolução de tenant no login:** `src/lib/tenant-resolver.ts` compara o header `Host` com `TenantBranding.customDomain` (verificado). Em `localhost` e `*.netlify.app` não há match — os logins exibem o shell neutro `LOGIN_PORTAL_BRANDING`. Com domínio custom ativo (ex.: VitaCare), o login herda logo e cores do tenant.

> `DEFAULT_BRANDING` permanece como alias de `CLINIC_BRANDING_DEFAULTS` (deprecated).

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
  platformLabel  String   // ex. "Powered by Sistema Bibi"
  colorScheme    String   // light | dark | system
  customDomain   String?  // ex. saude.cliente.com.br (Tier 3)
  customDomainVerified Boolean
}
```

Relação 1:1 com `Tenant`. O seed cria dois tenants demo:

- **Clínica Horizonte** — branding teal (clínica demo padrão da POC)
- **VitaCare** — branding azul (demonstração white label)

A landing pública (`/`) **não** usa branding de nenhum tenant — sempre exibe `PLATFORM_BRANDING` (Sistema Bibi).

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
| `NavTabs` | Navegação horizontal (`aria-label="Navegação por abas"`) |
| `Breadcrumbs` | Trilha hierárquica (`Cliente 360°`, atendimento prestador) |
| `SectionNav` | Âncoras em páginas de rota única (PJ, beneficiário) |
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
| `InternoNav` | Abas internas + `MobileNavDrawer` no mobile |
| `NavigationProgress` | Barra de progresso no topo durante troca de rota |
| `LandingMobileMenu` | Menu hamburger da landing |

Config de menus e rótulos: `src/lib/navigation/routes.ts`.

## Uso em páginas

```tsx
// Landing comercial — identidade fixa da plataforma (sem banco)
const branding = getPlatformBranding();

// Login público — tenant por domínio custom ou shell neutro
const branding = await getLoginBrandingFromHeaders();

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
// Após login, user.branding vem de getSessionUser() (tenant da sessão)
```

## Status badges

Mapas reutilizáveis em `src/lib/theme/status-styles.ts`:

- `appointmentStatusClass`
- `invoiceStatusClass`
- `companyStatusClass`
- `timelineActionClass`

Preferir `Badge` ou `statusBadgeClass(map, value)` em novas telas.

## White label na prática

1. Cada tenant possui registro `TenantBranding` (ou fallback com nome da clínica + `CLINIC_BRANDING_DEFAULTS`).
2. Após login, `getSessionUser()` retorna `user.branding` do tenant da sessão.
3. `PortalHeader` exibe logo/nome da **clínica** e faixa `{platformLabel}` (ex.: "Powered by Sistema Bibi").
4. Cores são aplicadas via `TenantTheme` sem rebuild do front-end.
5. Logins em URL genérica (`localhost`, `*.netlify.app`) mostram shell neutro; domínio custom do tenant personaliza o login antes da autenticação.

## Administração de branding (Portal Interno)

Rota: **`/interno/branding`** (aba **White Label** na navegação interna).

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/interno/branding` | GET | Retorna branding do tenant logado |
| `/api/interno/branding` | PUT | Upsert de identidade visual |
| `/api/interno/branding/logo` | POST | Upload de logo (Netlify Blobs ou disco local em dev) |
| `/api/branding/logo/[tenantId]` | GET | Serve logo público do tenant |

**Presets** disponíveis em `src/lib/theme/presets.ts` (Horizonte, VitaCare, Amethyst, Forest).

**Storage de logo** (`src/lib/storage/tenant-logo.ts`):
- **Netlify (produção):** store `bibi-tenant-logos` via `@netlify/blobs`
- **Dev local:** fallback em `public/tenant-logos/` (gitignored)
- URL persistida: `/api/branding/logo/{tenantId}?v=...`
- Headers: `Cache-Tag: tenant-logo-{tenantId}` para purge on-demand

**Tema escuro (`colorScheme`):** `light` | `dark` | `system` — aplicado via `data-theme` em `TenantTheme`. Superfícies e status adaptam-se em `globals.css`.

**Domínio customizado (`customDomain`):** configurável em `/interno/branding` (Tier 3). Resolução via `src/lib/tenant-resolver.ts`; verificação manual na POC (sem challenge DNS automático).

**Validação** em `src/lib/theme/branding-validation.ts` (cores hex, URL/data URL do logo).

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
