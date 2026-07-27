# Branding — Energia Brasileira

Identidade visual padrão do **Sistema Bibi - ServiceOS** (produção **v3.0.28**; white-label desde v2.0).

## Marca circular (`BrandMark`) — v3.0.28

- Gradiente **Energia Brasileira** whitelabel (`heroFrom` → `heroTo`) com glows em `primary`/`accent`
- Formato **circular estilo iOS**, sem borda — monograma ou logo centralizado
- **Plataforma (home):** word mark **BIBI** caixa alta, 12px, margin-top 2px (`PLATFORM.brandMark` + `markText`)
- **Tenants:** inicial do `displayName` (ex.: CEDIG → C)
- **PWA iPhone:** gradiente laranja/âmbar (`brandMarkPwaInput`) — maskable 512 + `apple-touch-icon`
- SVG, PWA (`npm run icons:generate`) e UI React compartilham `src/lib/brand/brand-mark.ts`
- Preview em `/interno/branding` · API `GET /api/brand/mark` e `/api/brand/mark/[tenantId]`

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

## PWA — ícones e manifest (v3.0.28)

Pipeline único em `src/lib/brand/brand-mark.ts` — UI React, OG, rotas dinâmicas Next e PNGs estáticos compartilham a mesma entrada.

| Saída | Fonte | Observação |
|-------|-------|------------|
| UI (`BrandMark`) | `brandMarkFromBranding()` / `PLATFORM.brandMark` | Word mark **BIBI** na home da plataforma |
| PWA / iPhone | `brandMarkPwaInput()` | Gradiente laranja `#f97316` → `#fbbf24` — evita círculo azul genérico |
| PNG estático | `npm run icons:generate` | `public/icons/` — 180, 192, 512, 512 maskable (inset 12%), 1024 |
| Rotas OG Next | `src/app/icon.tsx`, `apple-icon.tsx` | Mesmo `brandMarkPwaInput()` em runtime |
| Manifest | `src/app/manifest.ts` | `theme_color: #f97316`; `purpose: maskable` no 512 |

### Regenerar após mudar marca

```bash
npm run icons:generate      # PWA web (public/icons/)
npm run mobile:resources    # Capacitor iOS/Android (mobile/resources → cap sync)
```

Commitar os PNGs gerados junto com a alteração de `brand-mark.ts` ou `brand-mark-og.tsx`.

### Troubleshooting — ícone antigo no iPhone

1. Remover o atalho **Adicionar à Tela de Início** existente.
2. Limpar cache do Safari (ou abrir em aba anônima) e acessar `/instalar`.
3. Reinstalar após deploy com os novos PNGs em `public/icons/`.
4. Confirmar `apple-touch-icon` e `icon-512-maskable.png` no deploy (smoke: footer da landing + DevTools → Application → Manifest).

## Arquivos de referência

- Marca circular: `src/lib/brand/brand-mark.ts` · `src/components/brand/BrandMark.tsx`
- OG / gerador PNG: `src/lib/brand/brand-mark-og.tsx` · `scripts/generate-brand-icons.mts`
- Ícones de módulo (nav): `src/lib/navigation/nav-icons.tsx` — ver [`ARQUITETURA_PORTAIS.md`](../produto/ARQUITETURA_PORTAIS.md) §Checklist nav
- Tokens CSS: `src/app/globals.css`
- Tokens TypeScript: `src/lib/theme/tokens.ts`
- Presets nicho: `src/lib/theme/presets-energia-brasileira.ts`
- Design system: [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md)
