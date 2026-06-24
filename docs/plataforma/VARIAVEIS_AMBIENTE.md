# Variáveis de ambiente — Sistema Bibi - ServiceOS

Referência única de **todas as variáveis** usadas pelo projeto: runtime da aplicação,
seed, deploy Netlify, CI, testes e restrições do **Cursor Cloud Agent**.

Template local: [`.env.example`](../.env.example) → copiar para `.env` (`cp .env.example .env`).

---

## Índice

1. [Resumo rápido](#1-resumo-rápido)
2. [Aplicação (runtime)](#2-aplicação-runtime)
3. [Seed e modo demo](#3-seed-e-modo-demo)
4. [Integrações — pagamentos](#4-integrações--pagamentos)
5. [Integrações — comunicação](#5-integrações--comunicação)
6. [SEO e URL pública](#6-seo-e-url-pública)
7. [Deploy Netlify](#7-deploy-netlify)
8. [CI / GitHub Actions](#8-ci--github-actions)
9. [Testes automatizados](#9-testes-automatizados)
10. [Runtime automático (não configurar)](#10-runtime-automático-não-configurar)
11. [Cursor Cloud Agent](#11-cursor-cloud-agent)
12. [Onde cada variável é lida](#12-onde-cada-variável-é-lida)

---

## 1. Resumo rápido

| Variável | Obrigatória | Padrão local | Uso |
|----------|-------------|--------------|-----|
| `DATABASE_URL` | Sim | `file:./dev.db` | Prisma + SQLite |
| `SESSION_SECRET` | Sim (prod) | fallback POC | Cookie de sessão + MFA challenge |
| `PAYMENT_GATEWAY` | Não | `mock` (dev) | Adapter PIX |
| `COMMUNICATION_PROVIDER` | Não | `console` (dev) | E-mail / SMS / WhatsApp |
| `CRON_SECRET` | Sim (cron) | — | Jobs `/api/cron/*` |
| `TELEMEDICINE_BASE_URL` | Não | `https://meet.bibi.health` | Links de telemedicina |
| `NEXT_PUBLIC_SITE_URL` | Não | `URL` Netlify / localhost | SEO, sitemap, Open Graph |
| `NEXT_PUBLIC_SALES_WHATSAPP` | Não | — | CTA comercial WhatsApp na landing |
| `NEXT_PUBLIC_SALES_WHATSAPP_MESSAGE` | Não | mensagem padrão | Texto pré-preenchido no wa.me |
| `NEXT_PUBLIC_MARKETING_ENABLED` | Não | `false` | Liga GTM/pixels (`true` em prod) |
| `NEXT_PUBLIC_GTM_ID` | Não | — | Google Tag Manager |
| `NEXT_PUBLIC_META_PIXEL_ID` | Não | — | Meta Pixel (opcional se usar só GTM) |
| `NEXT_PUBLIC_GOOGLE_ADS_ID` | Não | — | Google Ads / gtag (opcional) |
| `SEED_SCALE` | Não | `medium` | Volume da massa no seed |
| `APP_MODE` | Não | `demo` | `demo` \| `operation` — massa vs dados reais |
| `RUN_SEED_ON_BUILD` | Não | `true` em demo | Seed no build Netlify (`false` em operação) |
| `ALLOW_DEMO_RESET` | Não | `true` | Botão restaurar demo na UI |
| `NETLIFY` | Auto | `true` no deploy | Detecção de ambiente Netlify |

---

## 2. Aplicação (runtime)

### `DATABASE_URL`

| | |
|---|---|
| **Obrigatória** | Sim |
| **Formato** | `file:./dev.db` (path relativo ao `prisma/schema.prisma`) |
| **Onde** | `prisma/schema.prisma`, `src/lib/db.ts` |
| **Comportamento** | Em **Lambda/Netlify**, `db.ts` copia `prisma/dev.db` → `/tmp/bibi-dev.db` (único diretório gravável). No build CI, não redireciona para `/tmp`. |

```env
DATABASE_URL="file:./dev.db"
```

### `SESSION_SECRET`

| | |
|---|---|
| **Obrigatória** | Sim em produção (não use o fallback) |
| **Padrão se ausente** | `bibi-poc-dev-secret-change-me` |
| **Onde** | `src/lib/session.ts`, `src/lib/mfa.ts` |
| **Uso** | Assinatura HMAC do cookie `bibi_session` e tokens temporários de MFA |

```env
SESSION_SECRET="string-longa-aleatoria-min-32-chars"
```

> **Netlify:** defina no painel (Site settings → Environment variables). O valor em `netlify.toml` é apenas fallback da POC.

### `NODE_ENV`

| | |
|---|---|
| **Quem define** | Next.js / Netlify / npm |
| **Valores** | `development` \| `production` \| `test` |
| **Onde** | `src/lib/db.ts`, bootstraps de payment/communication |
| **Efeito** | Nível de log Prisma; em dev, mock/console são registrados se gateway/provider não estiver definido |

Não precisa estar no `.env` local — o Next define automaticamente.

---

## 3. Seed e modo demo

Usadas por `prisma/seed.ts`, `scripts/setup-database.ts`, `src/lib/database-env.ts` e `src/lib/demo-reset.ts`.

Detalhes: [`OPERACAO_DADOS.md`](OPERACAO_DADOS.md).

### `DUAL_DATA_STORE`

| | |
|---|---|
| **Padrão** | `true` em dev e Netlify (`netlify.toml`) |
| **Valores** | `true` \| `false` |
| **Efeito** | Habilita seletor demo/operação e dual SQLite (`demo.db` + `operation.db`) |
| **Desligar** | `false` — um único `dev.db` legado (sem UI de troca) |

```env
DUAL_DATA_STORE=true
```

### `DATA_STORE_MODE`

| | |
|---|---|
| **Padrão** | `demo` (se Blobs/arquivo local vazio) |
| **Valores** | `demo` \| `operation` |
| **Onde** | Netlify Blobs (`bibi-config/data-store-mode`) ou `prisma/.data-store-mode` em dev |
| **UI** | `/interno/seguranca` → card “Base de dados” (ADMIN) — confirmação `OPERAR` / `DEMO` |
| **API** | `GET\|POST /api/interno/data-store` |

Modo inicial opcional no painel Netlify (antes da primeira troca na UI):

```env
DATA_STORE_MODE=demo
```

### `APP_MODE`

| | |
|---|---|
| **Padrão** | `demo` |
| **Valores** | `demo` \| `operation` |
| **Efeito** | Modo inicial legado se `DATA_STORE_MODE` ausente; `operation` desliga seed no build |

```env
APP_MODE=demo
```

### `RUN_SEED_ON_BUILD`

| | |
|---|---|
| **Padrão** | `true` em demo; `false` se `APP_MODE=operation` |
| **Build** | `scripts/netlify-build.mjs` → `setup-database.ts` |

```env
RUN_SEED_ON_BUILD=true
```

### `SEED_SCALE`

| | |
|---|---|
| **Padrão** | `medium` |
| **Valores** | `small` \| `medium` \| `large` |
| **Efeito** | Volume de agendamentos, mensagens, assinaturas e tenant VitaCare |

```env
SEED_SCALE=medium
```

### `ALLOW_DEMO_RESET`

| | |
|---|---|
| **Padrão** | `true` (habilitado se ausente) |
| **Desligar** | `false` ou `0` ou modo **operação** ativo no seletor |
| **UI** | `/interno/seguranca` → “Restaurar estado original do seed” (somente modo **demo**) |
| **API** | `POST /api/interno/demo/reset` (body: `{ "confirm": "RESTAURAR" }`) |
| **Permissão** | Somente interno **ADMIN** |

```env
ALLOW_DEMO_RESET=true
```

---

## 4. Integrações — pagamentos

### `PAYMENT_GATEWAY`

| | |
|---|---|
| **Padrão POC** | `mock` |
| **Valores** | `mock` \| `asaas` \| `efi` \| `inter` |
| **Onde** | `src/lib/payments/bootstrap.ts`, `payment-gateway.ts` |
| **POC** | `mock` → `MockPixAdapter` (QR/copia-e-cola fictícios) |

```env
PAYMENT_GATEWAY=mock
```

### Credenciais de gateways (planejadas — não lidas pelo código hoje)

Documentadas para integração futura. Ver [`PAYMENTS.md`](PAYMENTS.md).

```env
ASAAS_API_KEY=
EFI_CLIENT_ID=
EFI_CLIENT_SECRET=
INTER_CLIENT_ID=
INTER_CLIENT_CERT=
```

---

## 5. Integrações — comunicação

### `COMMUNICATION_PROVIDER`

| | |
|---|---|
| **Padrão POC** | `console` |
| **Valores** | `console` \| `sendgrid` \| `twilio` \| `meta` |
| **Onde** | `src/lib/communications/bootstrap.ts`, `communication-gateway.ts` |
| **POC** | `console` → log no servidor (`ConsoleEmailAdapter`) |

```env
COMMUNICATION_PROVIDER=console
```

### Credenciais de provedores (planejadas — não lidas pelo código hoje)

Ver [`COMMUNICATIONS.md`](COMMUNICATIONS.md).

```env
SENDGRID_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
META_WHATSAPP_TOKEN=
```

---

## 6. SEO e URL pública

### `NEXT_PUBLIC_SITE_URL`

| | |
|---|---|
| **Exposta ao browser** | Sim (prefixo `NEXT_PUBLIC_`) |
| **Onde** | `src/lib/landing/site-url.ts` |
| **Fallback** | `process.env.URL` (Netlify injeta automaticamente) → `VERCEL_URL` → `http://localhost:3000` |

```env
NEXT_PUBLIC_SITE_URL=https://sistema-bibi.netlify.app
```

### `URL` (Netlify)

Injetada automaticamente pela Netlify com a URL do deploy. Usada como fallback de `NEXT_PUBLIC_SITE_URL`. Não precisa definir manualmente.

### Comercial e marketing (landing)

| Variável | Uso |
|----------|-----|
| `NEXT_PUBLIC_SALES_WHATSAPP` | Número E.164 (`+5511970828949`). Se vazio, o botão **Fale com um especialista** não aparece. |
| `NEXT_PUBLIC_SALES_WHATSAPP_MESSAGE` | Mensagem inicial no WhatsApp. |
| `NEXT_PUBLIC_MARKETING_ENABLED` | `true` para injetar tags. Manter `false` em dev/CI. |
| `NEXT_PUBLIC_GTM_ID` | Container GTM (hub recomendado). |
| `NEXT_PUBLIC_META_PIXEL_ID` | Pixel Meta direto (opcional). |
| `NEXT_PUBLIC_GOOGLE_ADS_ID` | Conversões Google Ads (opcional). |

Guia de campanhas UTM: [`MARKETING_CAMPAIGNS.md`](MARKETING_CAMPAIGNS.md).

---

## 7. Deploy Netlify

Definidas em [`netlify.toml`](../netlify.toml) e/ou no painel Netlify.

| Variável | Onde | Valor / nota |
|----------|------|----------------|
| `NODE_VERSION` | `netlify.toml` `[build.environment]` | `22` |
| `NPM_FLAGS` | `netlify.toml` | `--include=dev` (instala devDeps no build) |
| `DATABASE_URL` | `netlify.toml` | `file:./dev.db` |
| `NETLIFY` | `netlify.toml`, `scripts/netlify-build.mjs` | `true` |
| `SESSION_SECRET` | `netlify.toml` (fallback) + **painel** | Trocar em produção |
| `NODE_ENV` | `context.production` | `production` |

O script [`scripts/netlify-build.mjs`](../scripts/netlify-build.mjs) no build:

1. Resolve `DATABASE_URL` absoluto para `prisma/dev.db`
2. Grava `.env` temporário com `DATABASE_URL`, `NETLIFY`, `SESSION_SECRET`
3. Executa `db:push` → `db:seed` → `next build`

Guia completo: [`DEPLOY_NETLIFY.md`](DEPLOY_NETLIFY.md).

---

## 8. CI / GitHub Actions

Arquivo: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).

| Variável | Job | Valor no CI |
|----------|-----|-------------|
| `SESSION_SECRET` | unit + e2e | `ci-test-session-secret-32chars` |
| `CRON_SECRET` | unit + e2e | `ci-cron-secret` |
| `DATABASE_URL` | unit (integração) | `file:./prisma/test.db` |
| `CI` | e2e Playwright | `true` |
| `PLAYWRIGHT_PORT` | e2e | `3100` |

---

## 9. Testes automatizados

### Vitest ([`vitest.config.ts`](../vitest.config.ts))

Defaults injetados em todos os testes:

```env
NODE_ENV=test
SESSION_SECRET=test-session-secret-32-chars-min
CRON_SECRET=test-cron-secret
PAYMENT_GATEWAY=mock
COMMUNICATION_PROVIDER=console
```

### Banco de testes ([`tests/helpers/db.ts`](../tests/helpers/db.ts))

- Usa `prisma/test.db` (isolado do `dev.db`)
- `DATABASE_URL` sobrescrito em runtime dos testes de integração/API

Ver também: [`TESTES.md`](TESTES.md).

---

## 10. Runtime automático (não configurar)

Variáveis detectadas pelo código ou pela plataforma — **não** colocar no `.env` manualmente.

| Variável | Origem | Uso no projeto |
|----------|--------|----------------|
| `AWS_LAMBDA_FUNCTION_NAME` | AWS Lambda (Netlify Functions) | `src/lib/db.ts` — ativa cópia SQLite → `/tmp` |
| `USE_REGIONAL_BLOBS` | Netlify (patch em `netlify/plugins/patch-regional-blobs`) | Forçado para `false` no handler Next.js |
| `VERCEL_URL` | Vercel (fallback genérico) | `site-url.ts` se deploy em Vercel |

---

## 11. Cursor Cloud Agent

O repositório **não define** variáveis `CURSOR_*` no código. O ambiente **Cursor Cloud** segue regras documentadas em [`AGENTS.md`](../AGENTS.md) (seção *Cursor Cloud specific instructions*).

### Setup inicial na VM do agente

| Passo | Comando / artefato | Notas |
|-------|-------------------|--------|
| Criar `.env` | `cp .env.example .env` | `.env` é **gitignored** — não vem no checkout |
| Banco | `npm run db:push && npm run db:seed` | Caminho **não destrutivo** |
| Evitar | `npm run db:reset` | **Bloqueado** para agentes (consentimento Prisma) |
| Persistência | Snapshot da VM | Após primeiro setup, `.env` e `dev.db` persistem |

### Comandos e restrições do agente

| Regra | Detalhe |
|-------|---------|
| `db:reset` / `prisma migrate` destrutivo | Aborta com prompt de consentimento |
| Setup recomendado | `db:push` + `db:seed` |
| Restaurar demo via UI | `ALLOW_DEMO_RESET=true` + login admin em `/interno/seguranca` |
| Branches CI | `cursor/**` disparam workflow (ver `ci.yml`) |

### Variáveis típicas na VM Cursor (mesmas do dev local)

O agente usa o mesmo `.env.example`. Não há secrets Cursor-specific no repositório — credenciais demo vêm do **seed** (`bibi123`).

### Documentação que o agente deve ler

| Arquivo | Conteúdo |
|---------|----------|
| `AGENTS.md` / `CLAUDE.md` | Stack, portais, credenciais, restrições |
| Este arquivo | Mapa completo de env vars |
| `docs/plataforma/DEPLOY_NETLIFY.md` | Deploy e envs de produção |
| `docs/plataforma/TESTES.md` | Env vars de CI/testes |

---

## 12. Onde cada variável é lida

| Variável | Arquivo(s) principal(is) |
|----------|---------------------------|
| `DATABASE_URL` | `prisma/schema.prisma`, `src/lib/db.ts`, `scripts/netlify-build.mjs` |
| `SESSION_SECRET` | `src/lib/session.ts`, `src/lib/mfa.ts` |
| `PAYMENT_GATEWAY` | `src/lib/payments/bootstrap.ts`, `payment-gateway.ts` |
| `COMMUNICATION_PROVIDER` | `src/lib/communications/bootstrap.ts`, `communication-gateway.ts`, `api/interno/messages` |
| `CRON_SECRET` | `src/app/api/cron/reminders/route.ts`, `cron/webhooks/route.ts` |
| `TELEMEDICINE_BASE_URL` | `src/lib/telemedicine.ts` |
| `NEXT_PUBLIC_SITE_URL` | `src/lib/landing/site-url.ts` |
| `SEED_SCALE` | `prisma/seed-data/scale.ts` |
| `ALLOW_DEMO_RESET` | `src/lib/demo-reset.ts` |
| `NETLIFY` | `scripts/netlify-build.mjs` |
| `NODE_ENV` | `src/lib/db.ts`, bootstraps payment/communication |

---

## Ver também

- [`.env.example`](../.env.example) — template comentado
- [`README.md`](../README.md) — início rápido
- [`PAYMENTS.md`](PAYMENTS.md) — gateways PIX
- [`COMMUNICATIONS.md`](COMMUNICATIONS.md) — provedores de mensagem
- [`DEPLOY_NETLIFY.md`](DEPLOY_NETLIFY.md) — painel Netlify
