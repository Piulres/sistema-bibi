# PWA — app shell mobile (ServiceOS v3.0)

Guia operacional da trilha **Progressive Web App** — instalação em iPhone/Android, validação local e smoke pós-build.

**Changelog da versão:** [`../versoes/V3_0.md`](../versoes/V3_0.md) · **Produção:** [`../versoes/RELEASES.md`](../versoes/RELEASES.md)

---

## O que está publicado (v3.0.0)

| Recurso | Rota / artefato | Descrição |
|---------|-----------------|-----------|
| Manifest | `/manifest.webmanifest` | `display: standalone`, ícones 192/512, `start_url: /` |
| Guia de instalação | `/instalar` | Instruções por plataforma (iOS Safari / Android Chrome) |
| Ícones | `/icons/*` | `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` |
| Metas Apple | HTML da home | `apple-mobile-web-app-*`, `apple-touch-icon` |
| Detecção standalone | `isStandaloneDisplay()` | Mensagem “já instalado” em `/instalar` |

**Fora de escopo v3.0.0:** service worker, cache offline, push notifications, Capacitor (fase B — ver [`../../mobile/README.md`](../../mobile/README.md)).

---

## Arquitetura no código

| Arquivo | Papel |
|---------|-------|
| `src/app/manifest.ts` | Web App Manifest (Next.js `MetadataRoute.Manifest`) |
| `src/app/layout.tsx` | `manifest`, `appleWebApp`, `icons`, `themeColor` no root layout |
| `src/app/instalar/page.tsx` | Página pública do guia (`robots: noindex`) |
| `src/components/pwa/PwaInstallGuide.tsx` | Passos iOS/Android + detecção `standalone` |
| `src/lib/pwa/install.ts` | `PWA_INSTALL_PATH`, `PWA_APPLE`, `isStandaloneDisplay()` |
| `public/icons/` | PNGs servidos estaticamente pela Netlify |
| `scripts/smoke-netlify-pwa.mjs` | Smoke pós-build no `pre-release` |

O manifest **não** altera `PLATFORM.release` — a versão exibida continua vindo de `src/lib/platform.ts`.

---

## Como testar (desenvolvedor)

### Local — `next dev`

```bash
npm run dev
# Abrir http://localhost:3000/instalar
# Verificar http://localhost:3000/manifest.webmanifest (JSON com display: standalone)
```

No iPhone real: use tunnel (ngrok, Cloudflare) apontando para `:3000` — Safari exige HTTPS para “Adicionar à Tela de Início” em alguns cenários.

### Pacote fechado — `pre-release`

O smoke PWA roda automaticamente após `npm run netlify:build`:

```bash
npm run pre-release
# ou isolado, após build:
npm run smoke:netlify-pwa
```

O script sobe `next start`, valida:

- `/`, `/instalar`, `/login`, `/interno/login` → HTML 200
- `/manifest.webmanifest` → `display: standalone`, ≥2 ícones
- `/icons/icon-192.png`, `icon-512.png`, `apple-touch-icon.png` → PNG 200
- Home contém `rel="manifest"`, `apple-touch-icon`, `mobile-web-app-capable`
- Pelo menos um chunk CSS em `/_next/static/` → 200

### Produção — smoke manual

```bash
# Manifest
curl -s https://sistema-bibi.netlify.app/manifest.webmanifest | jq '.display,.icons|length'

# Ícones
curl -s -o /dev/null -w "%{http_code}\n" https://sistema-bibi.netlify.app/icons/icon-512.png

# Guia
curl -s -o /dev/null -w "%{http_code}\n" https://sistema-bibi.netlify.app/instalar
```

Checklist completo de release: [`RELEASES.md`](../versoes/RELEASES.md) (seção Smoke).

---

## Instalação no dispositivo (usuário final)

### iPhone (Safari)

1. Abrir https://sistema-bibi.netlify.app/instalar no **Safari** (Chrome no iOS não instala PWA).
2. Compartilhar → **Adicionar à Tela de Início** → Adicionar.
3. Abrir pelo ícone — modo `standalone` (sem barra do Safari).

### Android (Chrome)

1. Abrir `/instalar` no Chrome.
2. Menu (⋮) → **Instalar app** ou **Adicionar à tela inicial**.

Após instalar, os quatro portais (`/login`, `/interno/login`, `/pj/login`, `/beneficiario/login`) funcionam no mesmo shell — sessão e cookies seguem o comportamento normal do navegador.

---

## Restrições e armadilhas

| Situação | Comportamento |
|----------|---------------|
| Chrome no iPhone | Não oferece “Adicionar à Tela de Início” — usar Safari |
| Sem service worker | App **não** funciona offline; requer rede |
| Tenant / segmento | Cookie `bibi_segment` e `?tenant=` funcionam igual ao browser |
| White label | Ícones são da plataforma (não por tenant) na v3.0.0 |
| `/_next/static` 404 pós-deploy | Build incompleto — **não** usar `netlify deploy --no-build` |

---

## Próximos passos (fase B)

Documentados em [`../versoes/V3_0.md`](../versoes/V3_0.md):

- Scaffold Capacitor em `mobile/`
- Splash + ícones nativos
- Service worker (cache básico)
- TestFlight / distribuição interna

---

## Referências

| Documento | Conteúdo |
|-----------|----------|
| [`DEPLOY_NETLIFY.md`](DEPLOY_NETLIFY.md) | Deploy e troubleshooting Netlify |
| [`OPERACOES.md`](OPERACOES.md) | Pacotes fechados e `pre-release` |
| [`LANDING_CHANGELOG.md`](LANDING_CHANGELOG.md) | Highlight PWA em `#novidades` |
| [`../versoes/V3_0.md`](../versoes/V3_0.md) | Escopo e changelog v3.0 |
