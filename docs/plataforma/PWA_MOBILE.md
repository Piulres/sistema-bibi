# PWA e mobile — ServiceOS v3.0 (fundação)

Runbook da **experiência app no celular** via PWA (`display: standalone`). A
fundação já está em **produção** sob o pacote **v2.6.0** — `PLATFORM.release` não
muda até fechar o pacote **v3.0.0**.

> **Escopo completo v3.0:** [`../versoes/V3_0.md`](../versoes/V3_0.md) · **Release:** [`../versoes/RELEASES.md`](../versoes/RELEASES.md) · **Capacitor (futuro):** [`../../mobile/README.md`](../../mobile/README.md)

---

## O que existe hoje (Fase A)

| Item | Detalhe |
|------|---------|
| Manifest | `display: standalone` · `start_url: /` · ícones 192/512 + maskable |
| Metas Apple | `appleWebApp` + `apple-mobile-web-app-capable` na home |
| Guia de instalação | `/instalar` — passos iOS (Safari) e Android (Chrome) |
| Detecção standalone | `isStandaloneDisplay()` — `matchMedia` + `navigator.standalone` (iOS) |
| Service worker | **Não** — cache offline é fase seguinte |
| Prompt “Instalar app” na landing | **Não** — usuário usa menu do navegador ou `/instalar` |

**Produção (25/07/2026):** deploy `6a654678` @ `e738f12` (`bibi-poc-2026-07-25j`) — smoke PWA OK.

---

## Mapa de código

| Caminho | Função |
|---------|--------|
| `src/app/manifest.ts` | Web App Manifest (Next `MetadataRoute.Manifest`) |
| `src/app/layout.tsx` | `manifest`, `appleWebApp`, ícone Apple, metas legadas |
| `src/app/instalar/page.tsx` | Página pública do guia (sem auth) |
| `src/components/pwa/PwaInstallGuide.tsx` | UI do guia + detecção de plataforma |
| `src/lib/pwa/install.ts` | `PWA_INSTALL_PATH`, `PWA_APPLE`, `isStandaloneDisplay()` |
| `public/icons/` | `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` |

O manifest é servido em **`/manifest.webmanifest`** (convenção Next App Router).

---

## Rotas e assets (smoke)

| URL | Esperado |
|-----|----------|
| `/` | HTML com `rel="manifest"`, metas Apple, chunk CSS `/_next/static/*.css` |
| `/instalar` | 200 HTML — guia de instalação |
| `/manifest.webmanifest` | JSON · `display: standalone` · `icons` ≥ 2 |
| `/icons/icon-192.png` | 200 PNG |
| `/icons/icon-512.png` | 200 PNG |
| `/icons/apple-touch-icon.png` | 200 PNG |
| `/login`, `/interno/login` | 200 HTML (portais após instalar) |

---

## Como testar (desenvolvedor)

### Local

```bash
npm run dev
# Safari (iPhone) ou Chrome (Android) → http://localhost:3000
# Guia: http://localhost:3000/instalar
```

1. Abrir no **Safari** (iOS) ou **Chrome** (Android).
2. Instalar na tela de início (menu Compartilhar / Instalar app).
3. Abrir pelo ícone — deve rodar **sem barra do navegador** (`standalone`).
4. Em `/instalar`, com app já instalado, o guia mostra confirmação verde.

### Pacote (antes de deploy)

```bash
npm run pre-release
# último passo: scripts/smoke-netlify-pwa.mjs
```

Ou isolado (após `npm run netlify:build`):

```bash
npm run smoke:netlify-pwa
```

O smoke sobe `next start` no artefato de build e valida rotas + manifest + estáticos — mesmo pipeline que o plugin Netlify empacota.

---

## Troubleshooting

| Sintoma | Causa provável | Ação |
|---------|----------------|------|
| iPhone não oferece “Adicionar à Tela de Início” | Abriu no Chrome/Firefox | Usar **Safari** |
| Ícone abre com barra do Safari | Não instalou via A2HS | Repetir fluxo em `/instalar` |
| `/manifest.webmanifest` 404 após deploy | Build incompleto ou cache CDN | Rodar `pre-release`; deploy com build integrado (**não** `--no-build`) |
| Smoke falha em CSS `/_next/static` | `next build` quebrado ou porta ocupada | Ver logs do smoke; `npm run netlify:build` isolado |
| `503 usage_exceeded` em produção | Cota Netlify | Não é bug PWA — validar local |

---

## Próximas fases (v3.0)

| Fase | Entrega |
|------|---------|
| A (parcial) | SW cache básico · prompt não intrusivo na landing |
| B | Scaffold Capacitor em `mobile/` — WKWebView apontando à URL Netlify |

Não alterar `PLATFORM.release` / `package.json` `version` para `3.0.0` até fechar o pacote — ver isolamento em [`V3_0.md`](../versoes/V3_0.md).

---

## Referências

- Testes: [`TESTES.md`](TESTES.md) — seção smoke PWA
- Deploy: [`DEPLOY_NETLIFY.md`](DEPLOY_NETLIFY.md)
- Jornada UX mobile: [`../produto/JORNADA_CLIENTE.md`](../produto/JORNADA_CLIENTE.md)
