# Branding — Energia Brasileira

Identidade visual padrão do **Sistema Bibi - ServiceOS** (produção **v3.0.24**; white-label desde v2.0).

## Cores principais

| Nome | Hex | Papel |
|------|-----|-------|
| **Dark Slate** | `#1e293b` | Cor primária — botões, logo, confiança |
| **Orange** | `#f97316` | Accent universal — CTAs, hover, destaques |
| **Amber** | `#f59e0b` | Gradiente hero (transição suave) |

## BrandMark (v3.0.24)

Marca circular whitelabel — gradiente mesh Energia Brasileira, estilo iOS, **sem borda nem sombra**. Fonte única para UI React, SVG estático, OG/PWA e ícones nativos.

### Comportamento

| Entrada | Resultado |
|---------|-----------|
| `logoUrl` definido | Logo centralizada (~62% do diâmetro) |
| Sem logo | Inicial do `displayName` (primeira letra significativa; fallback `B`) |
| Cores | `heroFrom` → `heroTo` (mesh); fallback `primaryColor` → `accentColor` |
| Portais autenticados | `useThemeColors` — herda `--brand-*` do `TenantTheme` |

### Tamanhos (`BrandMarkSize`)

| Token | px | Uso típico |
|-------|-----|------------|
| `xs` | 24 | Badges compactos |
| `sm` | 36 | Header mobile |
| `md` | 40 | Header desktop (padrão) |
| `lg` | 64 | Login / cards |
| `xl` | 96 | Destaques |
| `pwa` | 512 | Geração de PNG/SVG estático |

### Arquitetura (fonte única)

```
TenantBranding / BrandMarkInput
        │
        ▼
resolveBrandMarkLayout()  ──► brandMarkMeshBackground()  → UI React (BrandMark.tsx)
        │
        └──► buildBrandMarkSvg()  → API /api/brand/mark · e-mails · exports
        │
        └──► OgBrandMark  → icon.tsx · apple-icon.tsx · npm run icons:generate
```

| Artefato | Caminho |
|----------|---------|
| Lógica compartilhada | `src/lib/brand/brand-mark.ts` |
| Componente React | `src/components/brand/BrandMark.tsx` |
| OG / ícones dinâmicos | `src/lib/brand/brand-mark-og.tsx` |
| SVG por tenant | `GET /api/brand/mark` · `GET /api/brand/mark/[tenantId]` |
| Testes unitários | `tests/unit/brand-mark.test.ts` |

### Geração de assets

```bash
npm run icons:generate    # public/icons/*.png a partir de PLATFORM_BRANDING
npm run mobile:resources  # icons + cap sync (Capacitor)
```

Após alterar tokens de marca ou layout, regenere ícones e valide PWA (`/instalar`) e `mobile/README.md`.

## Componentes

- **Botões:** `<Button variant="primary">` para Dark Slate; `<Button variant="accent">` para Orange
- **Cards:** `<Card accent>` para borda lateral orange
- **Badges:** `<Badge tone="accent">` para destaque orange
- **Hero reutilizável:** `EnergiaBrasileiraHero` em `src/components/landing/`
- **Marca:** `<BrandMark branding={…} size="md" />` ou `useThemeColors` nos portais

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
- `BrandMark`: `aria-label` quando `title` é passado; inicial decorativa quando não

## Arquivos de referência

- Tokens CSS: `src/app/globals.css`
- Tokens TypeScript: `src/lib/theme/tokens.ts`
- Presets nicho: `src/lib/theme/presets-energia-brasileira.ts`
- Design system: [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md)
- Changelog visual: [`../versoes/V3_0.md`](../versoes/V3_0.md) §v3.0.24
