# Histórico — 21 de junho de 2026

Auditoria consolidada de **commits**, **pull requests** e **deploys Netlify** do dia,
com o estado da documentação ao final do ciclo.

> **Head atual da `main`:** `8a8211c` (merge do PR #34).
> **Produção ativa:** https://sistema-bibi.netlify.app

---

## Resumo executivo

| Métrica | Valor |
|---------|-------|
| PRs mergeados | **27** (#1–#28, exceto #2 fechado) |
| Commits no dia | **~70+** (incluindo merges e agentes) |
| Sites Netlify | `sistema-bibi` (principal) · `sistema-bibi-nt2` (secundário) |
| Produção online | ✅ `sistema-bibi.netlify.app` responde HTTP 200 |
| Deploy Git (CI) pós-#34 | ✅ build corrigido — ver Atualização 22/06 |
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
- **Deploy Git automático:** ✅ corrigido (PR #34) — ver Atualização 22/06.
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
| `README.md` | URLs produção, massa seed, PRs #1–#34 |
| `AGENTS.md` | Tiers + deploy + massa demo 50 empresas |
| `docs/DEPLOY_NETLIFY.md` | Pipeline build CI, `db.ts` Lambda-only, troubleshooting |
| `docs/FLUXOS.md` | Mapa completo + CTA alertas PJ (PR #34) |
| `docs/BENCHMARK.md` | Matriz vs iClinic/Feegow/ERPMed (PR #25) |
| `docs/NOTEBOOKLM.md` | RAG atualizado + massa seed |
| `docs/HISTORICO_2026-06-21.md` | Este arquivo (atualizado 22/06) |
| `docs/evidencias/` | Vídeos e imagens dos fluxos |

---

## Próximos passos sugeridos

1. **Definir `SESSION_SECRET` e `CRON_SECRET`** no painel Netlify (não usar fallback do `netlify.toml`).
2. **Migrar SQLite → Postgres** (Netlify Database) antes de dados reais.
3. **Tier 5** — SSO OAuth/SAML, validação XSD TISS completa.

---

## Atualização 22/06 — PRs #29–#34

> **Head atual da `main`:** `8a8211c` (merge do PR #34).

### Resumo

| PR | Título | Entregas documentadas |
|----|--------|----------------------|
| [#29](https://github.com/Piulres/sistema-bibi/pull/29) | docs: auditoria 21/06 | Evidências, histórico, deploy |
| [#30](https://github.com/Piulres/sistema-bibi/pull/30) | fix(netlify): builds GitHub | `DATABASE_URL` no CI |
| [#31](https://github.com/Piulres/sistema-bibi/pull/31) | feat(seed): 50 clientes PJ | `prisma/seed-data/companies.ts` |
| [#32](https://github.com/Piulres/sistema-bibi/pull/32) | fix(netlify): CI tsx | `NPM_FLAGS=--include=dev` |
| [#33](https://github.com/Piulres/sistema-bibi/pull/33) | feat(seed): massa completa | `scenarios.ts`, histórico clínico/financeiro |
| [#34](https://github.com/Piulres/sistema-bibi/pull/34) | fix: builds GitHub + CTA PJ | `db.ts` Lambda-only, `netlify-build.mjs`, alertas PJ |

### Deploy Git — correção final (PR #34)

Problemas encadeados nos builds GitHub/Netlify:

1. **`DATABASE_URL` nos workers Next** — `netlify-build.mjs` grava `.env` com path absoluto.
2. **`db.ts` redirecionava `/tmp` no build** — agora só quando `AWS_LAMBDA_FUNCTION_NAME` está definido.
3. **`tsx` ausente no CI** — `NPM_FLAGS=--include=dev` no `netlify.toml` (PR #32).

- **Build local:** `npm run netlify:build` — ✅ passa.
- **Deploy Git automático:** ✅ corrigido (PR #34).

### Seed — massa operacional

- **50 empresas PJ** com cenários de mercado (`companies.ts`).
- **~199 beneficiários**, **27 usuários PJ**, histórico de agenda, PPU, faturas e assinaturas (`scenarios.ts`).
- Fluxo demo TechCorp preservado para walkthroughs.

### Portal PJ — CTA em alertas

Cobranças de assinatura vencidas exibem botão **"Ver assinaturas"** (`href: "#assinaturas"`)
em `PjView`, gerado por `getPjPortalOverview()`.
