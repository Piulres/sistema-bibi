# Branding — Energia Brasileira

Identidade visual padrão do **Sistema Bibi - ServiceOS** (produção **v3.0.26**; release **v3.0.27** em `main` — ver [`../versoes/RELEASES.md`](../versoes/RELEASES.md)). White-label desde v2.0.

## Marca circular (`BrandMark`)

Gradiente **Energia Brasileira** whitelabel (`heroFrom` → `heroTo`) com glows em `primary`/`accent`. Formato **circular estilo iOS**, sem borda — monograma ou logo centralizado.

| Camada | Arquivo / API |
|--------|---------------|
| Lógica compartilhada | `src/lib/brand/brand-mark.ts` |
| Componente React | `src/components/brand/BrandMark.tsx` |
| Link clicável (home) | `src/components/brand/HomeBrandLink.tsx` |
| Landing header | `src/components/landing/LandingLogoLink.tsx` |
| SVG / OG / PWA | `buildBrandMarkSvg`, `OgBrandMark`, `npm run icons:generate` |
| Preview admin | `/interno/branding` |
| API | `GET /api/brand/mark` · `GET /api/brand/mark/[tenantId]` |

### Texto no círculo (v3.0.26)

- **Plataforma (home `/`):** círculo exibe **Bibi** via `PLATFORM.brandMark` → `PLATFORM_BRANDING.markText`; título ao lado continua **Sistema Bibi** (`PLATFORM.brandName`).
- **Tenants whitelabel:** inicial derivada de `displayName` (ex.: CEDIG → **C**); opcional `markText` em `BrandingTokens` para sobrescrever.
- Resolução: `brandMarkText()` em `brand-mark.ts` — `markText` explícito ou `brandMarkInitial(displayName)`.

### Mesh visível no header claro (v3.0.27)

O círculo da landing ficava “invisível” quando só `backgroundImage` era aplicado sobre fundo branco. Correção:

1. **`brandMarkMeshStyle()`** retorna `{ backgroundColor, backgroundImage }` — `backgroundColor` usa `heroFrom` como fallback sólido antes das camadas de gradiente.
2. **`brandMarkThemeMeshStyle()`** — mesmo padrão via CSS vars (`var(--brand-hero-from)`), usado quando `useThemeColors` está ativo.
3. **`LandingLogoLink`** passa `useThemeColors` + `logoSize="lg"` (64px) para herdar o mesh do `TenantTheme` (mesmo caminho dos portais autenticados).
4. **`HomeBrandLink`** ativa `useThemeColors` automaticamente quando cores explícitas não são passadas.

```tsx
// Landing — mesh via TenantTheme, tamanho legível
<HomeBrandLink displayName={branding.displayName} markText={branding.markText}
  useThemeColors logoSize="lg" />
```

### Tamanhos

| Token `size` | Pixels | Uso típico |
|--------------|--------|------------|
| `xs` | 24 | Badges compactos |
| `sm` | 36 | Nav mobile |
| `md` | 40 | Headers de portal (padrão) |
| `lg` | 64 | Landing header |
| `xl` | 96 | Hero / destaque |
| `pwa` | 512 | Ícones gerados (`icons:generate`) |

Tipografia do monograma escala com comprimento do texto (`brandMarkFontSizePx`).

### Regenerar ícones PWA

Após alterar `PLATFORM.brandMark` ou tokens de plataforma:

```bash
npm run icons:generate    # public/icons/* a partir de PLATFORM_BRANDING
npm run mobile:resources  # Capacitor (opcional)
```

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

## Troubleshooting

| Sintoma | Causa provável | Verificar |
|---------|----------------|-----------|
| Círculo “vazio” no header da landing | `backgroundImage` sem fallback em fundo claro | `useThemeColors` + `backgroundColor` em `BrandMark` (#377) |
| Monograma mostra **S** em vez de **Bibi** | `markText` ausente em `PLATFORM_BRANDING` | `PLATFORM.brandMark` em `src/lib/platform.ts` |
| Ícone PWA desatualizado | PNG estático não regenerado | `npm run icons:generate` após mudar tokens |
| Tenant com inicial errada | `displayName` vazio ou só espaços | `brandMarkInitial` retorna **B** como fallback |

## Arquivos de referência

- Tokens CSS: `src/app/globals.css`
- Tokens TypeScript: `src/lib/theme/tokens.ts` (`PLATFORM_BRANDING`)
- Presets nicho: `src/lib/theme/presets-energia-brasileira.ts`
- Testes: `tests/unit/brand-mark.test.ts`
- Design system: [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md)
