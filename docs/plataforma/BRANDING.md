# Branding — Energia Brasileira

Identidade visual padrão do **Sistema Bibi - ServiceOS** (produção **v3.0.19**; white-label desde v2.0).

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

## Marca circular (`BrandMark`) — v3.0.19

Ícone whitelabel reutilizado em headers, login, PWA e exports. Fonte única de geometria em `src/lib/brand/brand-mark.ts`.

| Uso | Componente / API |
|-----|------------------|
| UI (portais, landing) | `<BrandMark branding={…} size="md" />` — `src/components/brand/BrandMark.tsx` |
| Cores do tenant logado | `useThemeColors` — herda `--brand-*` do `TenantTheme` |
| SVG estático (e-mail, OG) | `buildBrandMarkSvg(input, size)` |
| API pública | `GET /api/brand/mark` (plataforma) · `GET /api/brand/mark/[tenantId]` (tenant) |

**Comportamento:**

- Sem logo uploadado: exibe **inicial** do `displayName` (ex.: “Clínica Horizonte” → **C**)
- Com logo: círculo com gradiente whitelabel + logo centralizado
- Tamanhos UI: `xs` · `sm` · `md` · `lg` · `xl` — PWA usa `512px` (`BRAND_MARK_SIZE_PX.pwa`)

**Ícones PWA / Apple Touch:**

```bash
npm run icons:generate   # scripts/generate-brand-icons.mts → public/icons/
```

Saída: `public/icons/icon-*.png`, `apple-touch-icon.png` — alinhados à marca circular da plataforma. Tenants whitelabel continuam servindo SVG dinâmico via API.

Doc complementar: [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) §Administração de branding.

## Arquivos de referência

- Tokens CSS: `src/app/globals.css`
- Tokens TypeScript: `src/lib/theme/tokens.ts`
- Marca circular: `src/lib/brand/brand-mark.ts` · `src/components/brand/BrandMark.tsx`
- Presets nicho: `src/lib/theme/presets-energia-brasileira.ts`
- Design system: [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md)
