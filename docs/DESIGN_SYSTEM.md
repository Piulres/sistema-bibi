# Design System & White Label — Sistema Bibi

Plataforma visual unificada com identidade configurável por tenant (white label).

## Visão geral

O design system separa três camadas:

1. **Tokens globais** (`src/app/globals.css`) — superfícies, texto, bordas, status e variáveis de marca.
2. **Branding por tenant** (`TenantBranding` + `TenantTheme`) — cores, nome de exibição, tagline e logo injetados em runtime via CSS variables.
3. **Tema por portal** (`src/lib/theme/portals.ts`) — acentos visuais dos quatro portais (Prestador, Interno, PJ, Beneficiário).

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
}
```

Relação 1:1 com `Tenant`. O seed cria dois tenants demo:

- **Clínica Bibi Saúde** — branding teal (padrão)
- **VitaCare** — branding azul (demonstração white label)

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
| `NavTabs` | Navegação horizontal (usado em `InternoNav`) |

## Layout

| Componente | Descrição |
|------------|-----------|
| `TenantTheme` | Injeta CSS variables no subtree |
| `PortalShell` | Header + main padronizado para portais autenticados |
| `PageHeader` | Título + descrição de página |

## Uso em páginas

```tsx
// Portal autenticado
const user = await getSessionUser();
return (
  <PortalShell
    portal="interno"
    portalLabel={PORTALS.interno.label}
    loginPath={PORTALS.interno.loginPath}
    userName={user.name}
    branding={user.branding}
  >
    <PageHeader title="..." description="..." />
    {/* conteúdo */}
  </PortalShell>
);

// Login / landing (sem sessão)
const branding = await getPlatformBranding();
```

## Status badges

Mapas reutilizáveis em `src/lib/theme/status-styles.ts`:

- `appointmentStatusClass`
- `invoiceStatusClass`
- `companyStatusClass`
- `timelineActionClass`

Preferir `Badge` ou `statusBadgeClass(map, value)` em novas telas.

## White label na prática

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

**Validação** em `src/lib/theme/branding-validation.ts` (cores hex, URL/data URL do logo).

## Componentes auxiliares

| Componente | Uso |
|------------|-----|
| `StatusBadge` | Badges de status com mapas semânticos |
| `SectionHeader` | Título + descrição de seção |
| `LoadingState` / `EmptyState` | Estados de carregamento e vazio |

## Próximos passos sugeridos

- Modo escuro por tenant (opcional)
- CDN/cache tags para purge de logo após troca
