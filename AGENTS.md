<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Sistema Bibi - ServiceOS — guia para agentes

**Versão:** v3.0.5 · **Produção:** `docs/versoes/RELEASES.md` (site ainda **v3.0.4** até deploy confirmado) · https://sistema-bibi.netlify.app

Plataforma **multi-segmento** Pay Per Use com **quatro portais** (Prestador, Interno, PJ, Beneficiário). Saúde = segmento `MEDICAL` — não é HealthOS.

## Configuração Cursor

| Recurso | Quando |
|---------|--------|
| `.cursor/rules/router.mdc` | Sempre (router mínimo) |
| `/serviceos-dev-quality` | Feature, bugfix, testes, refatoração |
| `docs/plataforma/OPERACOES.md` | Ops, branches, deploy |
| `docs/prompts/SERVICEOS_V2_IMPLEMENTATION.md` | Features novas |

## Stack (resumo)

Next.js 16 · React 19 · Prisma **6** · SQLite · Tailwind v4 · Vitest · Playwright

```bash
npm run setup    # VM nova: .env + db (idempotente)
npm run dev      # http://localhost:3000
npm run lint
npm run pre-release   # validar pacote (não publica)
```

**Setup:** `npm run setup` ou `db:push && db:seed` · **`db:reset` bloqueado** para agentes.

## Credenciais demo

Senha: **`bibi123`**

| Portal | E-mail |
|--------|--------|
| Prestador | `dra.helena@bibi.health` |
| Interno (admin) | `faturamento@bibi.health` |
| Interno (MFA) | `seguranca@bibi.health` — TOTP `JBSWY3DPEHPK3PXP` |
| PJ | `rh@techcorp.com` |
| Beneficiário | `joao.pereira@email.com` |

Mais logins: `README.md` · `SEED_SCALE=small|medium|large` no `.env`

## Multi-nicho (obrigatório em UI)

- Labels: `useLabels()` — nunca "Paciente"/"Beneficiário" fixos
- Dicionário: `src/constants/niches.ts` (`NICHE_MASTER_LABELS`)
- Segmento: `?tenant=petcare` · cookie `bibi_segment` · `docs/segmentos/README.md`

## Branches e PRs

`cursor/<nome>-<suffix>` → PR → **`dev`** → (pacote) → `main` → deploy manual humano

**Proibido (agente):** `netlify deploy`, `db:reset`, PR feature → `main`, loops em produção.  
**503 `usage_exceeded`:** cota Netlify — não é bug.

## Gotchas não óbvios

1. **Proxy Next 16:** `src/proxy.ts` (não `middleware.ts`) — auth real em `src/lib/session.ts`
2. **Async APIs:** `await params`, `await searchParams`, `await cookies()`
3. **Prisma 7 quebra** o schema — fixado em v6
4. **Pós-`npm test`:** dual-store pode quebrar login → `npm run setup`
5. **E2E:** pare `npm run dev` antes de `test:e2e` (porta 3100)
6. **Schema-sync operation.db:** Blob congela schema — ver `docs/plataforma/OPERACAO_DADOS.md` §Schema-sync

## Índice de documentação

| Tópico | Arquivo |
|--------|---------|
| Índice geral | `docs/README.md` |
| Operações / agentes | `docs/plataforma/OPERACOES.md` |
| Workflow Cursor | `docs/plataforma/WORKFLOW_CURSOR.md` |
| Testes | `docs/plataforma/TESTES.md` |
| Fluxos de negócio | `docs/produto/FLUXOS.md` |
| Arquitetura | `docs/plataforma/ARQUITETURA.md` |
| Env vars | `docs/plataforma/VARIAVEIS_AMBIENTE.md` |
| Demo vs operação | `docs/plataforma/OPERACAO_DADOS.md` |
| Deploy Netlify | `docs/plataforma/DEPLOY_NETLIFY.md` |
| CEDIG | `docs/clientes/cedig/STATUS.md` |
| Prompts | `docs/prompts/README.md` |

Detalhes de navegação SPA, RBAC, CRUD, design system e histórico: ver índice em `docs/README.md`.
