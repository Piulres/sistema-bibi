# Histórico — 21 de junho de 2026

Auditoria consolidada de **commits**, **pull requests** e **deploys Netlify** do dia,
com o estado da documentação ao final do ciclo.

> **Head atual da `main`:** `beeb894` (merge do PR #28).
> **Produção ativa:** https://sistema-bibi.netlify.app (deploy via CLI; ver seção Deploys).

---

## Resumo executivo

| Métrica | Valor |
|---------|-------|
| PRs mergeados | **27** (#1–#28, exceto #2 fechado) |
| Commits no dia | **~70+** (incluindo merges e agentes) |
| Sites Netlify | `sistema-bibi` (principal) · `sistema-bibi-nt2` (secundário) |
| Produção online | ✅ `sistema-bibi.netlify.app` responde HTTP 200 |
| Deploy Git (CI) pós-#28 | ❌ build falha (exit code 2) — ver Deploys |
| Evidências visuais | ✅ `docs/evidencias/` (vídeos + screenshots dos fluxos) |

---

## Pull requests mergeados

### Infraestrutura e deploy

| PR | Título | Merge (UTC) |
|----|--------|-------------|
| [#3](https://github.com/Piulres/sistema-bibi/pull/3) | Configurar deploy na Netlify para testes da POC | 21/06 18:35 |
| [#16](https://github.com/Piulres/sistema-bibi/pull/16) | Preparar Netlify (build pronto, sem publicar) | 21/06 20:31 |
| [#26](https://github.com/Piulres/sistema-bibi/pull/26) | Setup do ambiente de desenvolvimento (Cloud Agent) | 21/06 22:06 |
| [#27](https://github.com/Piulres/sistema-bibi/pull/27) | Get the updated repository and try to deploy | 21/06 22:07 |
| [#28](https://github.com/Piulres/sistema-bibi/pull/28) | fix(netlify): Blobs regional + Prisma rhel | 22/06 00:19 |

> **PR #2** — *Build and deploy project online* — **fechado sem merge**.

### Épicos comerciais (#4–#11)

| PR | Épico |
|----|-------|
| [#4](https://github.com/Piulres/sistema-bibi/pull/4) | Cliente 360° — Patient Overview |
| [#5](https://github.com/Piulres/sistema-bibi/pull/5) | Timeline Universal — auditoria |
| [#6](https://github.com/Piulres/sistema-bibi/pull/6) | CRM Corporativo — pipeline |
| [#7](https://github.com/Piulres/sistema-bibi/pull/7) | Motor de Cobrança (PIX/boleto/cartão) |
| [#8](https://github.com/Piulres/sistema-bibi/pull/8) | Recorrência — assinaturas |
| [#9](https://github.com/Piulres/sistema-bibi/pull/9) | Portal Beneficiário self-service |
| [#10](https://github.com/Piulres/sistema-bibi/pull/10) | Comunicação — fila de mensagens |
| [#11](https://github.com/Piulres/sistema-bibi/pull/11) | Dashboard Executivo — KPIs |

### Tiers de produto (#17–#20)

| PR | Tier | Entregas |
|----|------|----------|
| [#17](https://github.com/Piulres/sistema-bibi/pull/17) | **Tier 1** | Fatura, PIX mock, pagamento, lembretes |
| [#18](https://github.com/Piulres/sistema-bibi/pull/18) | **Tier 2** | CRUD admin, agenda, relatórios, PEP |
| [#19](https://github.com/Piulres/sistema-bibi/pull/19) | **Tier 3** | RBAC, webhooks B2B, portal PJ, LGPD |
| [#20](https://github.com/Piulres/sistema-bibi/pull/20) | **Tier 4** | MFA TOTP, telemedicina, TISS XML, webhook retry |

### Design system e white label (#13–#15)

| PR | Entrega |
|----|---------|
| [#13](https://github.com/Piulres/sistema-bibi/pull/13) | Design system semântico + white label |
| [#14](https://github.com/Piulres/sistema-bibi/pull/14) | Logo via Netlify Blobs |
| [#15](https://github.com/Piulres/sistema-bibi/pull/15) | Tema escuro por tenant + cache tags |

### Correções e documentação (#12, #21–#25)

| PR | Título |
|----|--------|
| [#12](https://github.com/Piulres/sistema-bibi/pull/12) | fix: bugs abertos, docs e base NotebookLM |
| [#21](https://github.com/Piulres/sistema-bibi/pull/21) | fix: build — PIX beneficiário e TISS assinatura |
| [#22](https://github.com/Piulres/sistema-bibi/pull/22) | docs: Tiers 1–4, OpenAPI, adapters |
| [#23](https://github.com/Piulres/sistema-bibi/pull/23) | fix: botões PIX e marcar paga no faturamento |
| [#24](https://github.com/Piulres/sistema-bibi/pull/24) | docs: mapa completo de fluxos (`FLUXOS.md`) |
| [#25](https://github.com/Piulres/sistema-bibi/pull/25) | docs: matriz Ações × Benchmark |

### Scaffold

| PR | Título |
|----|--------|
| [#1](https://github.com/Piulres/sistema-bibi/pull/1) | Scaffold do Sistema Bibi (POC HealthTech SaaS) |

---

## Deploys Netlify

### Sites

| Site | URL | Papel |
|------|-----|-------|
| **sistema-bibi** | https://sistema-bibi.netlify.app | Produção principal |
| **sistema-bibi-nt2** | https://sistema-bibi-nt2.netlify.app | Site secundário / testes |

### Linha do tempo (site `sistema-bibi`)

| Horário (UTC) | Contexto | Estado | Commit / nota |
|---------------|----------|--------|---------------|
| 21/06 23:14–23:59 | production | ❌ error | `94c0f67` — build exit code 2 |
| 21/06 23:37–23:52 | production | ✅ ready | Deploys CLI bem-sucedidos |
| 22/06 00:01–00:12 | production | ✅ ready | Deploys CLI — **site no ar** |
| 22/06 00:15 | deploy-preview | ❌ error | PR #28 preview |
| 22/06 00:19–00:25 | production | ❌ error | `beeb894` — merge PR #28, build Git falhou |

### Problemas corrigidos no PR #28

1. **Blobs regionais** — `USE_REGIONAL_BLOBS=true` derrubava o handler sem `primaryRegion`.
   - Correção: plugin `netlify/plugins/patch-regional-blobs` (força `false` no `onEnd`).
2. **Prisma Query Engine** — build gerava `debian-openssl-3.0.x`, Lambda exige `rhel-openssl-3.0.x`.
   - Correção: `binaryTargets = ["native", "rhel-openssl-3.0.x"]` no schema.
3. **Publish directory** — painel tinha `.next` (incorreto para Next.js runtime); corrigido via API.

### Status atual

- **Produção:** https://sistema-bibi.netlify.app — landing e logins respondem **HTTP 200**.
- **Build local:** `npm run netlify:build` — ✅ passa.
- **Deploy Git automático:** ❌ ainda falha após merge do #28 — investigar logs no painel Netlify.
- **Deploy CLI:** `npx netlify deploy --prod` — validado no PR #28.

### Credenciais em produção

Mesmas do seed local — senha **`bibi123`**. Ver [`README.md`](../README.md) seção 6.

---

## Evidências dos fluxos

Material visual capturado durante validação do ambiente (PR #26 / branch `cursor/dev-env-setup-f6a6`):

📁 [`docs/evidencias/README.md`](evidencias/README.md)

| Fluxo | Vídeo | Código principal |
|-------|-------|------------------|
| Prestador Pay Per Use | `bibi_prestador_payperuse_demo.mp4` | `AtendimentoView.tsx` |
| Interno faturamento PIX | `fluxo_interno_faturamento_payperuse.mp4` | `BillingView.tsx` |
| Beneficiário agendamento | `fluxo_beneficiario_agendamento.mp4` | `BeneficiarioView.tsx` |
| Tour portal interno | `nav2_portal_interno.mp4` | `src/components/*View.tsx` |
| Beneficiário + PJ | `nav3_beneficiario_pj.mp4` | `PjView.tsx` |

18 screenshots em `docs/evidencias/imagens/` (landing, dashboards, faturamento, CRM, etc.).

---

## Documentação atualizada neste ciclo

| Documento | Estado |
|-----------|--------|
| `README.md` | URLs produção, evidências, operações |
| `AGENTS.md` | Tiers + deploy + preferências IA |
| `docs/DEPLOY_NETLIFY.md` | Status deploy, plugin Blobs, troubleshooting |
| `docs/OPERACOES.md` | Mapa de operações + regras agentes |
| `docs/RELEASES.md` | Pacotes fechados |
| `docs/WORKFLOW_CURSOR.md` | Workflow Cursor sem deploy auto |
| `.cursor/rules/operacoes-bibi.mdc` | Preferências IA (Cursor rules) |
| `docs/FLUXOS.md` | Mapa completo (PR #24) |
| `docs/BENCHMARK.md` | Matriz vs iClinic/Feegow/ERPMed (PR #25) |
| `docs/NOTEBOOKLM.md` | RAG atualizado Tiers 1–4 |
| `docs/HISTORICO_2026-06-21.md` | Este arquivo |
| `docs/evidencias/` | Vídeos e imagens dos fluxos |

---

## Próximos passos sugeridos

1. **Desligar deploy Git automático** — Stop builds no painel Netlify (ver `OPERACOES.md`).
2. ~~**Publicar pacote pendente**~~ — ✅ `bibi-poc-2026-06-22b` publicado em 22/06 (~02:36 UTC).
3. **Definir `SESSION_SECRET` e `CRON_SECRET`** no painel Netlify (não usar fallback do `netlify.toml`).
4. **Migrar SQLite → Postgres** (Netlify Database) antes de dados reais.
5. **Tier 5** — SSO OAuth/SAML, validação XSD TISS completa.

### PR #41 — Testes automatizados (22/06)

- Vitest: 53 testes em `tests/` (unit, security, integration, api)
- Playwright: 5 specs E2E em `e2e/smoke.spec.ts`
- CI: `.github/workflows/ci.yml` — lint, test, build, e2e
- Mapa: `docs/TESTES.md`

### PR #44 — Restauração modo demo (22/06)

- UI: `/interno/seguranca` → `DemoResetCard` (ADMIN)
- API: `GET|POST /api/interno/demo/reset`
- Lógica: `src/lib/demo-reset.ts` → `runDatabaseSeed()`
- Flag: `ALLOW_DEMO_RESET` (off em produção por padrão)

### PR #46 — Variáveis de ambiente (22/06)

- `docs/VARIAVEIS_AMBIENTE.md` — mapa completo (app, Netlify, CI, Cursor)

### Release `bibi-poc-2026-06-22b` (22/06 ~02:36 UTC)

- Commit `92348ba` — PRs #29–#46
- Deploy: `npx netlify deploy --prod --no-build`
- Produção: HTTP 200 — ver `docs/RELEASES.md`

### PR #42 — Operações e pacotes fechados (22/06)

- `docs/OPERACOES.md` — mapa completo de operações
- `docs/RELEASES.md` — manifesto de pacotes
- `docs/WORKFLOW_CURSOR.md` — dev sem deploy automático
- `.cursor/rules/operacoes-bibi.mdc` — preferências de IA
- `npm run pre-release` — validação sem publicar
