# Deploy na Netlify — Sistema Bibi

Guia para publicar a POC quando a conta e o ambiente estiverem prontos.
**O repositório já inclui `netlify.toml` e scripts de build — não é necessário publicar agora.**

---

## O que já está preparado

| Item | Descrição |
|------|-----------|
| `netlify.toml` | Build, env vars, headers, `netlify dev` |
| `npm run build:netlify` | `db:push` + seed + `next build` |
| `src/lib/db.ts` | Copia SQLite seedado para `/tmp` em serverless |
| `next.config.ts` | Inclui `prisma/**` no bundle serverless |
| `@netlify/blobs` | Logos white-label em produção |
| Site CLI (opcional) | Projeto `sistema-bibi-2` pode estar linkado localmente |

---

## Antes de publicar

1. **Créditos / plano Netlify** — se o site retornar `503 usage_exceeded`, aguarde reset ou upgrade.
2. **`SESSION_SECRET`** — defina no painel (Site settings → Environment variables), **não** use o fallback do `netlify.toml`.
3. **Banco** — SQLite + `/tmp` é **apenas POC** (dados efêmeros por instância). Produção real → [Netlify Database](https://docs.netlify.com/database/) (Postgres).
4. **Git** — conectar o repo no painel só quando quiser deploys automáticos.

---

## Variáveis de ambiente (Netlify UI)

| Variável | Obrigatória | Valor sugerido |
|----------|-------------|----------------|
| `DATABASE_URL` | Sim (build) | `file:./dev.db` (path relativo ao schema Prisma) |
| `SESSION_SECRET` | Sim | string longa aleatória (≥ 32 chars) |
| `NETLIFY` | Auto | `true` (já no `netlify.toml`) |
| `NODE_VERSION` | Não | `22` (já no `netlify.toml`) |

Opcionais (motores reais):

- `PAYMENT_GATEWAY`, credenciais em `docs/PAYMENTS.md`
- `COMMUNICATION_PROVIDER`, credenciais em `docs/COMMUNICATIONS.md`

---

## Comandos locais (sem publicar)

```bash
# Validar o mesmo pipeline do CI Netlify
npm run netlify:build

# Emular Netlify Dev (porta 8888 → Next :3000)
npm run netlify:dev
```

---

## Primeiro deploy manual (quando autorizado)

Pré-requisitos: [Netlify CLI](https://docs.netlify.com/cli/get-started/) autenticada (`npx netlify login`).

```bash
# 1. Linkar site (se ainda nao linkado)
npx netlify link

# 2. Preview (nao afeta producao)
npx netlify deploy

# 3. Producao (somente quando aprovado)
npx netlify deploy --prod
```

---

## Deploy contínuo via GitHub (opcional)

1. Netlify → **Add new site** → **Import an existing project** → GitHub → repo `sistema-bibi`.
2. Build command: `npm run build:netlify` (já no `netlify.toml`).
3. **Não** definir publish directory (Next.js runtime).
4. Adicionar env vars acima no painel.
5. Para evitar deploys acidentais: desativar **Auto publishing** em Deploys ou usar branch `production` apenas.

---

## Limitações conhecidas da POC na Netlify

- **SQLite** copiado para `/tmp` a cada cold start — escrita persiste só na mesma instância Lambda.
- **Seed no build** — cada deploy recria dados demo (intencional para POC).
- **Logos** — `@netlify/blobs` em produção; filesystem local em `next dev` puro.

---

## Troubleshooting

| Sintoma | Causa provável | Ação |
|---------|----------------|------|
| `503 usage_exceeded` | Cota Netlify | Aguardar ou upgrade |
| `prisma/prisma/dev.db` | `DATABASE_URL` errado | Use `file:./dev.db` (relativo ao schema) |
| Login falha | `SESSION_SECRET` diferente entre builds | Fixar secret no painel |
| Logo 404 | Blobs indisponível em dev puro | Use `netlify dev` ou URL externa |

---

## Evolução recomendada

1. Migrar Prisma → Postgres ([Netlify Database](https://docs.netlify.com/database/))
2. Remover seed do build de produção
3. Hash de senhas + secrets só no painel Netlify
4. Purge CDN de logos via `Cache-Tag: tenant-logo-{tenantId}`
