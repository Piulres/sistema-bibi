# Branding — Energia Brasileira

Identidade visual padrão do **Sistema Bibi - ServiceOS** (produção **v3.0.27**; white-label desde v2.0).

## Marca circular (`BrandMark`)

Gradiente **Energia Brasileira** whitelabel, formato **circular estilo iOS**, sem borda. Usada em headers, login, PWA, OG e landing.

| Camada | Arquivo | Função |
|--------|---------|--------|
| Lógica mesh / SVG | `src/lib/brand/brand-mark.ts` | `brandMarkMeshStyle`, `brandMarkThemeMeshStyle`, `buildBrandMarkSvg` |
| UI React | `src/components/brand/BrandMark.tsx` | Círculo + monograma ou logo |
| Home clicável | `src/components/brand/HomeBrandLink.tsx` | Link à `/` com scroll suave se já na home |
| Landing header | `src/components/landing/LandingLogoLink.tsx` | `useThemeColors` + tamanho `lg` (64px) |
| API | `GET /api/brand/mark` · `/api/brand/mark/[tenantId]` | SVG/PWA preview |
| Admin | `/interno/branding` | Preview ao vivo |

### Texto no círculo (v3.0.26)

- **Plataforma (home):** monograma **Bibi** via `PLATFORM.brandMark` em `src/lib/platform.ts` — título visível continua `PLATFORM.brandName` (**Sistema Bibi**).
- **Tenants whitelabel:** inicial derivada de `displayName` ou `markText` explícito em `BrandMarkInput`.
- **Logo:** quando `logoUrl` existe, o monograma é substituído pela imagem centralizada.

### Mesh e visibilidade (v3.0.27)

O gradiente do círculo usa **duas camadas CSS** — `backgroundColor` + `backgroundImage` — para evitar círculo “invisível” em headers claros:

```ts
// brand-mark.ts — mesh com cores explícitas (portais com input)
brandMarkMeshStyle(layout) → { backgroundColor: layout.backgroundFrom, backgroundImage: … }

// mesh via CSS vars do TenantTheme (landing dentro de TenantTheme)
brandMarkThemeMeshStyle() → { backgroundColor: "var(--brand-hero-from)", backgroundImage: … }
```

| Modo | Quando | Prop |
|------|--------|------|
| Tema (`TenantTheme`) | Landing header, portais sem cores explícitas | `useThemeColors` em `BrandMark` / `HomeBrandLink` |
| Cores explícitas | Preview branding, tenants com `primaryColor`/`accentColor` no input | `input` ou `branding` em `BrandMark` |

`LandingLogoLink` sempre passa `useThemeColors` — mesmo caminho visual dos portais autenticados.

### Pitfall — círculo sem fundo

Se só `backgroundImage` (gradiente) é aplicado sem `backgroundColor`, o mesh pode parecer transparente sobre `--surface-page` claro. **Sempre** usar `brandMarkMeshStyle` / `brandMarkThemeMeshStyle` (não montar gradiente manual na UI).

### PWA e ícones

SVG, PWA (`npm run icons:generate`) e UI React compartilham `brand-mark.ts`. Após mudar monograma da plataforma, regenerar ícones.

## Cores principais

| Nome | Hex | Papel |
|------|-----|-------|
| **Dark Slate** | `#1e293b` | Cor primária — botões, logo, confiança |
| **Orange** | `#f97316` | Accent universal — CTAs, hover, destaques |
| **Amber** | `#f59e0b` | Gradiente hero (transição suave) |

## Componentes

- **Botões:** `<Button variant="primary">` para Dark Slate; `<Button variant="accent">` para Orange
- **Cards:** `<Card accent>` para borda lateral orange
- **Badges:** `<Badge tone="accent">` para destaque orange
- **Hero reutilizável:** `EnergiaBrasileiraHero` em `src/components/landing/`

## Multi-nicho

Cada nicho tem cor primária customizada em `src/lib/theme/presets-energia-brasileira.ts`, mas **Orange permanece como accent global** em CTAs e estados de ação.

| Nicho | Primária | Accent |
|-------|----------|--------|
| MEDICAL | Dark Slate `#1e293b` | Orange |
| VET | Green `#059669` | Orange |
| DENTAL | Cyan `#0891b2` | Orange |
| LEGAL | Slate `#475569` | Orange |
| SPA | Purple `#a78bfa` | Orange |
| EDUCATION | Amber `#d97706` | Orange |

## Acessibilidade

- Dark Slate em fundo branco: contraste ~11.8:1 (AAA)
- Orange em fundo branco: contraste ~5.2:1 (AA)
- Orange em Dark Slate: contraste ~4.8:1 (AA)
- Focus rings em `#fb923c` (orange claro)
- Animações respeitam `prefers-reduced-motion`

## Testes

`tests/unit/brand-mark.test.ts` — mesh com `backgroundColor`, theme mesh via CSS vars, monograma Bibi, SVG circular multi-tenant. Ver [`TESTES.md`](TESTES.md).

## Arquivos de referência

- Tokens CSS: `src/app/globals.css`
- Tokens TypeScript: `src/lib/theme/tokens.ts` (`PLATFORM_BRANDING`)
- Plataforma: `src/lib/platform.ts` (`PLATFORM.brandMark`, `PLATFORM.brandName`)
- Presets nicho: `src/lib/theme/presets-energia-brasileira.ts`
- Design system: [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md)
