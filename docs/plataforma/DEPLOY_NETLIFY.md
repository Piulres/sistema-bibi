# Deploy na Netlify — Sistema Bibi - ServiceOS

Guia para publicar e manter a POC na Netlify.

**Produção ativa:** https://sistema-bibi.netlify.app
(site secundário: https://sistema-bibi-nt2.netlify.app)

Documentação relacionada: [`README.md`](../README.md) · [`FLUXOS.md`](../produto/FLUXOS.md) ·
[`ARQUITETURA.md`](ARQUITETURA.md) · [`HISTORICO_2026-06-21.md`](HISTORICO_2026-06-21.md)

---

## Status atual (27/06/2026)

| Item | Estado |
|------|--------|
| Site principal | ✅ https://sistema-bibi.netlify.app |
| Pacote em produção | **`v2.2.0`** — deploy `6a3ea6c5` @ `2c38248` |
| Pacote na `main` (aguarda deploy) | **`v2.3.0`** @ `84bccb9` |
| `main` / `dev` | Sincronizadas após release v2.3.0 |
| Validação pré-deploy | `npm run pre-release` (lint + docs + db + test + build) |
| Deploy produção | `npx netlify deploy --prod` (**com build integrado** — não usar `--no-build`) |
| Deploy Git automático | ⚠️ **Desligar** — ver [`WORKFLOW_CURSOR.md`](WORKFLOW_CURSOR.md) |
| Plugin Blobs regional | ✅ `netlify/plugins/patch-regional-blobs` |
| Prisma `binaryTargets` | ✅ `native` + `rhel-openssl-3.0.x` |

> **Pacotes fechados:** [`RELEASES.md`](../versoes/RELEASES.md) · **Workflow Cursor:** [`WORKFLOW_CURSOR.md`](WORKFLOW_CURSOR.md) · **Operações:** [`OPERACOES.md`](OPERACOES.md)
>
> Não publique a cada merge. Valide localmente e publique só quando decidir fechar um pacote.

---

## O que já está preparado

| Item | Descrição |
|------|-----------|
| `netlify.toml` | Build, env vars, headers, `netlify dev`, plugin Blobs |
| `netlify/plugins/patch-regional-blobs` | Desativa `USE_REGIONAL_BLOBS` no handler Next.js (PR #28) |
| `npm run build:netlify` | `db:push` + seed + `next build` |
| `prisma/schema.prisma` | `binaryTargets = ["native", "rhel-openssl-3.0.x"]` para Lambda |
| `src/lib/db.ts` | Copia SQLite seedado para `/tmp` em serverless |
| `next.config.ts` | Inclui `prisma/**` no bundle serverless |
| `@netlify/blobs` | Logos white-label em produção |
| Cron endpoints | `/api/cron/reminders`, `/api/cron/webhooks` (protegidos por `CRON_SECRET`) |
| Site CLI | Projeto `sistema-bibi` linkado na conta Netlify |

---

## Antes de publicar

1. **Créditos / plano Netlify** — se o site retornar `503 usage_exceeded`, aguarde reset ou upgrade.
2. **`SESSION_SECRET`** — defina no painel (Site settings → Environment variables), **não** use o fallback do `netlify.toml`.
3. **`CRON_SECRET`** — obrigatório se usar scheduled functions para lembretes/webhooks.
4. **Banco** — SQLite + `/tmp` é **apenas POC** (dados efêmeros por instância). Produção real → [Netlify Database](https://docs.netlify.com/database/) (Postgres).
5. **Publish directory** — deve ficar **vazio** no painel (Next.js runtime gerencia o output). Valor `.next` causa falhas.
6. **Git** — deploy contínuo **desligado** (Stop builds). Publicação só via pacote fechado — ver [`OPERACOES.md`](OPERACOES.md).

---

## Variáveis de ambiente (Netlify UI)

> Mapa completo (app + CI + Cursor): [`VARIAVEIS_AMBIENTE.md`](VARIAVEIS_AMBIENTE.md)

| Variável | Obrigatória | Valor sugerido |
|----------|-------------|----------------|
| `DATABASE_URL` | Sim (build) | `file:./dev.db` (path relativo ao schema Prisma) |
| `SESSION_SECRET` | Sim | string longa aleatória (≥ 32 chars) |
| `CRON_SECRET` | Sim (cron) | string longa aleatória para jobs agendados |
| `PAYMENT_GATEWAY` | Não | `mock` (POC) ou `asaas`/`efi`/`inter` |
| `COMMUNICATION_PROVIDER` | Não | `console` (POC) ou `sendgrid`/`twilio`/`meta` |
| `TELEMEDICINE_BASE_URL` | Não | URL base das salas virtuais mock |
| `SEED_SCALE` | Não | `medium` — volume do seed no build |
| `ALLOW_DEMO_RESET` | Não | `true` — botão restaurar demo na UI |
| `NETLIFY` | Auto | `true` (já no `netlify.toml`) |
| `NODE_VERSION` | Não | `22` (já no `netlify.toml`) |

Credenciais de gateways reais: ver [`PAYMENTS.md`](PAYMENTS.md) e [`COMMUNICATIONS.md`](COMMUNICATIONS.md).

---

## Comandos locais (sem publicar)

```bash
# Validar pacote fechado (lint + build Netlify) — RECOMENDADO antes de publicar
npm run pre-release

# Validar só o build Netlify (mesmo pipeline do CI)
npm run netlify:build

# Emular Netlify Dev (porta 8888 → Next :3000)
npm run netlify:dev
```

---

## Publicar em produção (pacote fechado)

```bash
# 1. Validar localmente
npm run pre-release

# 2. Publicar (build integrado — obrigatório para Next.js)
npx netlify deploy --prod --message "vX.Y.Z: descrição"

# 3. Smoke test — assets estáticos
curl -s https://sistema-bibi.netlify.app/ | rg -o '/_next/static/chunks/[^"]+\.css' | head -1 \
  | xargs -I{} curl -s -o /dev/null -w "%{http_code}\n" "https://sistema-bibi.netlify.app{}"
# Deve retornar 200
```

> **Não use `--no-build`** com `@netlify/plugin-nextjs`. O HTML é publicado, mas
> `/_next/static/chunks/*` fica em **404** e o front não hidrata.

---

## Deploy contínuo via GitHub (desaconselhado para POC)

Cada push na `main` consome **cota Netlify** e pode disparar agentes a tentar
corrigir “produção fora”. Para este projeto, prefira **pacotes fechados**:

1. Desligue builds automáticos: Netlify → **Stop builds** (ver [`WORKFLOW_CURSOR.md`](WORKFLOW_CURSOR.md)).
2. Desenvolva e valide com `npm run pre-release`.
3. Publique manualmente: `npx netlify deploy --prod`.
4. Registre em [`RELEASES.md`](../versoes/RELEASES.md).

Se ainda quiser CI Git: build command `npm run build:netlify` (já no `netlify.toml`);
**não** definir publish directory manualmente no painel (Next.js runtime).

---

## Jobs agendados (cron)

Configure scheduled functions ou serviço externo para chamar:

| Endpoint | Header | Função |
|----------|--------|--------|
| `POST /api/cron/reminders` | `x-cron-secret: $CRON_SECRET` | Lembretes de consulta/fatura/assinatura |
| `POST /api/cron/webhooks` | `x-cron-secret: $CRON_SECRET` | Retry de webhooks com backoff |

---

## Limitações conhecidas da POC na Netlify

- **Modo demo** — SQLite copiado para `/tmp` por instância Lambda; escrita não compartilhada entre cold starts (OK para apresentação).
- **Modo operação** — SQLite + **Netlify Blobs** (`bibi-databases/operation.db`); escritas compartilhadas entre instâncias. Ver [`OPERACAO_DADOS.md`](OPERACAO_DADOS.md).
- **Seed no build** — gera `demo.db` com massa completa; cada deploy recria o snapshot demo.
- **Seletor demo/operação** — `/interno/seguranca` (ADMIN); persistência do modo em Blobs (`bibi-config/data-store-mode`).
- **Logos** — `@netlify/blobs` em produção; filesystem local em `next dev` puro.
- **MFA / webhooks / PIX** — funcionam na POC; no modo demo dependem do SQLite efêmero por instância.

**Postgres** — opcional para escala futura (`DUAL_DATA_STORE=false` + `DATABASE_URL=postgresql://...`). Não é obrigatório para operar com dados reais na POC atual.

---

## Troubleshooting

| Sintoma | Causa provável | Ação |
|---------|----------------|------|
| `503 usage_exceeded` | Cota Netlify esgotada | Aguardar reset/upgrade; dev local continua; ver `RELEASES.md` |
| `502` / handler crash | Blobs regionais sem `primaryRegion` | Plugin `patch-regional-blobs` (PR #28) |
| `Prisma Client could not locate Query Engine` | binary target errado | `rhel-openssl-3.0.x` no schema |
| Build Git exit code 2 | Divergência build remoto vs local | Comparar log Netlify com `npm run netlify:build` |
| `prisma/prisma/dev.db` | `DATABASE_URL` errado | Use `file:./dev.db` (relativo ao schema) |
| Login falha | `SESSION_SECRET` diferente entre builds | Fixar secret no painel |
| Logo 404 | Blobs indisponível em dev puro | Use `netlify dev` ou URL externa |
| Cron 401 | `CRON_SECRET` ausente ou incorreto | Definir no painel e no caller |
| Walk-in some na agenda (modo demo) | Instâncias Lambda diferentes | Alternar para **modo operação** em `/interno/seguranca` |
| Dados “voltam” ao demo após deploy | Modo demo ativo ou cold start | Usar modo **operação**; dados reais ficam em Blobs |
| Front sem estilo / JS não carrega | Deploy com `--no-build` — chunks `/_next/static` em 404 | Republicar com `npx netlify deploy --prod` (sem `--no-build`); smoke test no chunk CSS |

---

## Demo vs operação em produção

Após deploy com dual-store (`DUAL_DATA_STORE=true`):

1. Login ADMIN → `/interno/seguranca`
2. **Ir para operação** → confirmar `OPERAR` (ou **demo** → `DEMO`)
3. Login novamente

Detalhes: [`OPERACAO_DADOS.md`](OPERACAO_DADOS.md).

---

## Evolução recomendada

1. **Opcional:** migrar Prisma → Postgres ([Netlify Database](https://docs.netlify.com/database/)) quando volume exigir
2. Gateways reais (Asaas, SendGrid) com secrets só no painel
3. Purge CDN de logos via `Cache-Tag: tenant-logo-{tenantId}`
4. SSO OAuth/SAML (Tier 5)
