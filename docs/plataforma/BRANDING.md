# Branding — Energia Brasileira

Identidade visual padrão do **Sistema Bibi - ServiceOS** (white-label desde v2.0). Marca circular unificada desde **v3.0.19** — ver também [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md).

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

## Marca circular (`BrandMark`)

Ícone whitelabel reutilizado em headers, login, PWA e embeds. Geometria e cores vêm de uma fonte única (`resolveBrandMarkLayout`).

| Uso | Onde |
|-----|------|
| UI React | `src/components/brand/BrandMark.tsx` — props `branding`, `input` ou `useThemeColors` |
| SVG estático | `buildBrandMarkSvg()` em `src/lib/brand/brand-mark.ts` |
| API pública | `GET /api/brand/mark` (plataforma) · `GET /api/brand/mark/[tenantId]` (tenant) |
| OG / build PNG | `src/lib/brand/brand-mark-og.tsx` (`OgBrandMark`) |

**Comportamento:**

- Sem `logoUrl`: exibe a **inicial** do `displayName` (ex.: “Clínica Horizonte” → **C**).
- Com logo: recorte circular sobre fundo branco dentro do gradiente accent.
- Cores: `primaryColor` (canvas), `accentColor`/`heroTo` (gradiente do círculo), frame fixo `#0a1018`.

**Tamanhos UI:** `xs` 24px · `sm` 36 · `md` 40 · `lg` 64 · `xl` 96 · `pwa` 512 (API/PNG).

### Ícones PWA

Gerados no build Netlify e localmente:

```bash
npm run icons:generate   # → public/icons/icon-192.png, icon-512.png, apple-touch-icon.png
```

O script usa o mesmo layout de `OgBrandMark` (`scripts/generate-brand-icons.mts`). O manifest PWA referencia esses arquivos — ver checklist em [`versoes/V3_0.md`](../versoes/V3_0.md).

**Cache:** plataforma `max-age=86400`; tenant `max-age=3600` + `Cache-Tag: tenant-brand-mark-{tenantId}`.

## Arquivos de referência

- Tokens CSS: `src/app/globals.css`
- Tokens TypeScript: `src/lib/theme/tokens.ts`
- Presets nicho: `src/lib/theme/presets-energia-brasileira.ts`
- Marca circular: `src/lib/brand/brand-mark.ts` · `src/components/brand/BrandMark.tsx`
- Design system: [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md)
