# Releases — Pacotes fechados do Sistema Bibi - ServiceOS

Registro oficial do que está **em produção**, do que está **pendente na `dev`**
e do histórico de publicações. Use este arquivo como fonte única de verdade.

**Fluxo de branches:** features integram em `dev` → release merge `dev` → `main` → deploy.

**Produção:** https://sistema-bibi.netlify.app

---

## Status agora (26/07/2026)

> Pacote **v3.0.7** — UX mobile portais + dashboard + exports **em publicação**.

| Item | Valor |
|------|-------|
| **Versão em produção (sistema-bibi.netlify.app)** | **3.0.6** — deploy `6a65cf36` @ `ed14233` (`bibi-poc-2026-07-26f`) · *substituir após deploy v3.0.7* |
| **Modo de dados** | **operação** (Netlify Blobs) · tenant CEDIG provisionado |
| **Release `main` / `dev`** | **v3.0.7** (prep) · pendente sync pós-deploy |
| **Pacote anterior em produção** | **3.0.6** — deploy `6a65cf36` @ `ed14233` (`bibi-poc-2026-07-26f`) |
| **Doc** | [`V3_0.md`](V3_0.md) |

### Sincronização de ambientes

| Ambiente | Branch | Conteúdo |
|----------|--------|----------|
| **Integração** | `dev` | **v3.0.7** (prep) |
| **Release** | `main` | **v3.0.7** (prep) |
| **Netlify** | **sistema-bibi.netlify.app** | **3.0.6** até deploy `bibi-poc-2026-07-26g` |
| **Preview** | deploy-preview | Desligado via Stop builds |

### Conteúdo do pacote v3.0.7

- **Drawer mobile:** abre pela direita; remove contagem de módulos; categorias com contraste e separador.
- **Dashboard executivo:** hierarquia de KPIs e menos ruído visual.
- **Gestão clínica:** layout responsivo no mobile.
- **Exports:** CSV/JSON/TXT/PDF canônicos nos portais.

### Smoke (26/07/2026) — produção v3.0.6 (atual)

| Check | Resultado |
|-------|-----------|
| Landing `/` | 200 · footer `v3.0.6` |
| CSS `/_next/static/chunks/*.css` | 200 |
| `/instalar` | 200 |
| Cota Netlify | sem `503 usage_exceeded` |

### Conteúdo do pacote v3.0.6

- **Home comercial (#230):** funil dor → solução → como funciona → segmentos; copy Pay Per Use multi-nicho; nav com 7 âncoras.
- **Nav portais (#235):** redesign mobile/desktop nos 4 portais — menu Mais, scroll, `portal-nav.ts`.
- **Assistente (#232):** fecha o chat ao clicar em ação de navegação.
- **Docs (#237):** APIs clínicas §7 em `API_DOCS.md`; `PLANO_HOMEPAGE` e `flow-improvements-map` atualizados.

### Conteúdo do pacote v3.0.5

- **Prontuário / Care Chart (#221):** protocolos de exames editáveis + aplicar em lote; atestado estruturado (CFM); receita comum / controle especial com reativar.
- **Jornada do atendimento (#225):** stepper avança para Faturado/Pago com `hasPaidInvoice`/`hasOpenInvoice`; abas sem corte (scroll + rótulos curtos).
- **Landing (#226):** nav da home com 6 itens; marca do header = Sistema Bibi.
- **Portais (#227):** Tour sem `?`; remove faixa Powered by; badges de versão/nicho ocultos no mobile.

### Smoke (26/07/2026) — produção v3.0.5

| Check | Resultado |
|-------|-----------|
| Landing `/` | 200 · footer `v3.0.5` |
| CSS `/_next/static/chunks/*.css` | 200 |
| `/instalar` | 200 |
| Cota Netlify | sem `503 usage_exceeded` |

### Conteúdo do pacote v3.0.4

- **TISS:** validação estrutural da guia XML — fatura sem itens ou beneficiário sem documento → 422 `TissBuildError`; `escapeXml` completo (#212).
- **Cursor:** router único always-on, rules escopadas (tests, docs-release, interno), skill modular com references por domínio, `npm run cursor:verify` (#218).
- **Docs:** runbook schema-sync do `operation.db` em `OPERACAO_DADOS.md` + refs v3.0.3 (#219).

### Smoke (26/07/2026) — produção v3.0.4

| Check | Resultado |
|-------|-----------|
| Landing `/` | 200 · footer `v3.0.4` |
| CSS `/_next/static/chunks/*.css` | 200 |
| `/instalar` | 200 |
| Cota Netlify | sem `503 usage_exceeded` |

### Smoke (26/07/2026) — produção v3.0.3 (anterior)

| Check | Resultado |
|-------|-----------|
| Landing `/` | 200 · footer `v3.0.3` |
| CSS `/_next/static/chunks/*.css` | 200 |
| Login CEDIG (`operacao@cedig.demo`) | 200 |
| `GET /api/interno/clinic-finance/launches` · `.../kpis` | 200 |
| Users CEDIG sem leftovers golive/teste | 11 · Gabriela presente |
| Paciente Renan · 1 anamnese unificada | ✅ |
| `/instalar` | 200 |
| Cota Netlify | sem `503 usage_exceeded` |

### Conteúdo do pacote v3.0.3

- Flush do `operation.db` no Blob após schema-sync (evita re-migração a cada cold start).
- UX de erro em `/interno/gestao` (listagem/registro com mensagem útil).
- Limpeza da operação CEDIG: anamneses duplicadas unificadas; remoção de usuários/massa efêmera de golive/smoke (`scripts/cleanup-operation-test-data.mjs`).

### Conteúdo do pacote v3.0.2

- Hotfix: `src/lib/operation/schema-sync.ts` — migrações aditivas no boot Lambda quando o Blob está defasado em relação ao artefato de build (incidente 500 em `/interno/gestao`).

### Conteúdo do pacote v3.0.1

- Auditoria de fluxos rodada 3 — correções P1–P3 (#205): máquina de estados do agendamento, guards do beneficiário, feedback de erro, MFA/CRM já endurecidos.
- Labels multi-nicho nas views e breadcrumbs + bump actions CI + fast path `test.db` (#209).
- Docs vivas + CEDIG (#206) e auditoria mobile nos 4 portais (#207), já integrados na `dev`.

### Tags git (histórico)

| Tag | Commit aprox. | Conteúdo |
|-----|---------------|----------|
| **`v3.0.7`** | *(pendente deploy)* | Drawer mobile direita + dashboard + gestão mobile + exports canônicos |
| **`v3.0.6`** | `ed14233` | Home comercial + nav portais + assistente fecha ao navegar (#230/#232/#235) |
| **`v3.0.5`** | `cf0eb26` | Atendimento clínico + jornada faturada + UX landing/portais (#221/#225–#227) |
| **`v3.0.4`** | `fd22ebc` | TISS 422 + config Cursor enxuta + docs schema-sync (#212/#218/#219/#220) |
| **`v3.0.3`** | `fc9afa7` | Flush Blob + UX gestão (#214) + limpeza operação CEDIG (#217) |
| **`v3.0.2`** | `9ceeb49` | Hotfix: schema-sync do operation.db (incidente 500 em /interno/gestao) |
| **`v3.0.1`** | `daf690e` | Qualidade multi-nicho + regras da agenda (auditoria P1–P3 + labels + CI) |
| **`v3.0.0`** | `d2e0548` | PWA `/instalar` · manifest standalone · smoke Netlify |
| **`v2.6.0`** | `579f686` | CEDIG fase 2+F — ponte PPU + export + v2.5 login · #186–#189 · #193 |
| **`v2.5.0`** | _(empilhado)_ | Login tenant digitável + seletor de portal · PR #186 |
| **`v2.4.0`** | `c64fc14` | CEDIG gestão clínica · PR #169 |
| **`v2.3.1`** | `12148ce` | Versão no title/footer · `PLATFORM.release` |
| **`v2.3.0`** | `374b13e` | Assistente, construction ERP, onboarding fase 2, OpenAPI + docs alinhados |
| **`v2.2.0`** | `2c38248` | Onboarding tour guiado nos 4 portais |
| **`v2.1.0`** | `cd16555` | Assistente, VET/Pet, change-mgmt, import, segurança pós-POC |
| **`v2.0.0`** | `e823fe4` | ServiceOS multi-nicho + v1.3 estoque |
| `v1.2.0` | `485819a` | Care Chart, exports, homepage — substituído por v2.0 |
| `v1.1.0` | `8c8cd01` | Care Chart (substituído) |
| `v1.0.2` | `e30b2b0` | White label plataforma vs clínicas |
| `v1.0.1` | `e4d8a43` | Deploy Netlify inicial |
| `v1.0.0` | `685cc21` | POC inicial |
---

## Pacote em produção (fechado)

### `v3.0.0` — Sistema Bibi - ServiceOS (PWA mobile)

| Campo | Valor |
|-------|-------|
| **Tag git** | `v3.0.0` @ `d2e0548` |
| **Commit publicado** | `e30fc70` (docs rules) · bump `d2e0548` |
| **Doc** | [`V3_0.md`](V3_0.md) |
| **Inclui** | `/instalar` · manifest standalone · ícones iOS/Android · metas Apple · smoke `smoke-netlify-pwa` no pre-release · empilha v2.6 (CEDIG + login) |
| **Publicado em** | 25/07/2026 — deploy Netlify `6a654c88` @ `e30fc70` (`bibi-poc-2026-07-25k`) |

---

### `v2.6.0` — Sistema Bibi - ServiceOS (CEDIG fase 2+F · pontes) *(substituído por v3.0.0)*

| Campo | Valor |
|-------|-------|
| **Tag git** | `v2.6.0` |
| **Commit publicado** | `579f686` / tip PWA `e738f12` |
| **PRs** | [#186](https://github.com/Piulres/sistema-bibi/pull/186) · [#187](https://github.com/Piulres/sistema-bibi/pull/187) · [#188](https://github.com/Piulres/sistema-bibi/pull/188) · [#189](https://github.com/Piulres/sistema-bibi/pull/189) · [#193](https://github.com/Piulres/sistema-bibi/pull/193) |
| **Doc** | [`V2_6.md`](V2_6.md) · [`V2_5.md`](V2_5.md) · [`clientes/cedig/STATUS.md`](../clientes/cedig/STATUS.md) |
| **Inclui** | Ponte gestão→Patient/Appointment/PPU/Invoice · export · labels CLINIC_* · PJ×3 · E2E · login tenant/portal (v2.5) · skill agentes · matriz CRUD testes |
| **Publicado em** | 25/07/2026 — deploy Netlify `6a654678` @ `e738f12` (`bibi-poc-2026-07-25j`; anterior `6a6534e9` @ `579f686`) |

---

### `v2.5.0` — Login com tenant e seletor de portal *(empilhado em v2.6.0)*

| Campo | Valor |
|-------|-------|
| **Tag git** | _(não publicar isolado)_ |
| **PRs** | [#186](https://github.com/Piulres/sistema-bibi/pull/186) |
| **Doc** | [`V2_5.md`](V2_5.md) |
| **Inclui** | Tenant digitável · seletor de portal · `login-access.ts` · cookie `bibi_segment` |
| **Status** | Empilhado no pacote v2.6.0 |

---

### `v2.4.0` — Sistema Bibi - ServiceOS (CEDIG gestão clínica) *(substituído por v2.6.0)*

| Campo | Valor |
|-------|-------|
| **Tag git** | `v2.4.0` |
| **Commit publicado** | `527fe03` (hotfix CEDIG operação; tag `v2.4.0` @ `c64fc14`) |
| **PRs** | [#169](https://github.com/Piulres/sistema-bibi/pull/169) · [#172](https://github.com/Piulres/sistema-bibi/pull/172) |
| **Doc** | [`V2_4.md`](V2_4.md) · [`clientes/cedig/`](../clientes/cedig/) |
| **Inclui** | `/interno/gestao` · tabelas de preço CEDIG · seed 4 portais · CEDIG no bootstrap/provision operação |
| **Publicado em** | 25/07/2026 — deploy Netlify `6a6462dc` @ `527fe03` (`bibi-poc-2026-07-25d`; anterior `6a645cdc` @ `c64fc14`) |

---

### `v2.3.1` — Sistema Bibi - ServiceOS (versão no title e footer) *(substituído por v2.4.0)*

| Campo | Valor |
|-------|-------|
| **Tag git** | `v2.3.1` |
| **Commit publicado** | `12148ce` |
| **Inclui** | Title com `v{PLATFORM.release}` · footer da home com versão · sync package/changelog/OpenAPI |
| **Publicado em** | 25/07/2026 — deploy Netlify `6a643a0d` @ `12148ce` (`bibi-poc-2026-07-25b`) |

---

### `v2.3.0` — Sistema Bibi - ServiceOS (assistente + obras + onboarding fase 2) *(histórico)*

| Campo | Valor |
|-------|-------|
| **Tag git** | `v2.3.0` |
| **Commit publicado** | `374b13e` (main tip — docs alinhados + merge [#160](https://github.com/Piulres/sistema-bibi/pull/160)/[#161](https://github.com/Piulres/sistema-bibi/pull/161)) |
| **Commit do pacote** | `05a63eb` (prepare v2.3.0) — produção inclui commits posteriores (#151–#161) |
| **PRs** | [#148](https://github.com/Piulres/sistema-bibi/pull/148)*, [#149](https://github.com/Piulres/sistema-bibi/pull/149), [#152](https://github.com/Piulres/sistema-bibi/pull/152), construction+, [#156](https://github.com/Piulres/sistema-bibi/pull/156)–[#161](https://github.com/Piulres/sistema-bibi/pull/161) |
| **Doc** | [`V2_3.md`](V2_3.md) · [`produto/ONBOARDING_TOUR.md`](../produto/ONBOARDING_TOUR.md) |
| **Validação** | [`versoes/V2_3.md`](V2_3.md) |
| **Publicado em** | 25/07/2026 — deploy Netlify `6a6436ef` @ `374b13e` (`bibi-poc-2026-07-25a`; anterior `6a3f68e8` @ `38a3885`) |

\* PR #148 permanece aberto no GitHub, mas o conteúdo equivalente já entrou via merges posteriores na `dev`/`main`.

**Inclui (além de v2.2.0):**

- **Assistente operacional:** estado serverless (tokens HMAC), confirmação de ações em Netlify, anti-repetição multi-turno
- **Assistente multi-nicho:** RAG por segmento, procedimentos do catálogo do tenant, copiloto contextual por página
- **VET:** agendamento com tutor + pet (`search_pets`, auto-seleção de pet único)
- **Onboarding v3:** tour em duas fases, micro-tours por módulo, mobile, hotspots ([#152](https://github.com/Piulres/sistema-bibi/pull/152))
- **Engenharia Civil:** ERP empreiteira — pipeline, obras, orçamentos, BDI, caixa, RDO, portal campo, dupla aprovação e metas
- **OpenAPI:** 123 rotas documentadas + Swagger UI (`/api/docs`)
- **Massa demo:** seeds ricos multi-segmento + perfil `operation-1y`
- **Pós-pacote já no ar:** segurança assistente (RBAC/JTI), landing/comercial Q3, UX de loading/toasts (#151–#160)

---

### `v2.2.0` — Sistema Bibi - ServiceOS (onboarding guiado) *(substituído por v2.3.0)*

| Campo | Valor |
|-------|-------|
| **Tag git** | `v2.2.0` |
| **PRs** | [#142](https://github.com/Piulres/sistema-bibi/pull/142) |
| **Publicado em** | 25/06/2026 — deploy Netlify `6a3ea6c5` @ `2c38248` |

**Inclui (além de v2.1.0):**

- **Onboarding tour:** product tour automático na primeira visita a cada portal
- **Spotlight e hotspots:** destaque visual com tooltip posicionado automaticamente
- **Tours por portal:** interno, prestador, PJ e beneficiário com passos contextuais por rota
- **Labels multi-nicho:** textos do tour adaptados via `useLabels()` (paciente, pet, cliente…)
- **Reinício manual:** botão **Tour** no header de cada portal
- **Persistência:** `localStorage` (`bibi_onboarding`) por portal

**Testes:** 403 Vitest · 128 E2E · `docs:verify` · `db:verify` · `pre-release` OK.

---

### `v2.1.0` — Sistema Bibi - ServiceOS (pós-POC integrado) *(substituído por v2.2.0)*

| Campo | Valor |
|-------|-------|
| **Tag git** | `v2.1.0` |
| **PRs** | [#126](https://github.com/Piulres/sistema-bibi/pull/126)–[#133](https://github.com/Piulres/sistema-bibi/pull/133), [#129](https://github.com/Piulres/sistema-bibi/pull/129)–[#132](https://github.com/Piulres/sistema-bibi/pull/132), [#131](https://github.com/Piulres/sistema-bibi/pull/131) |
| **Doc** | [`V2_1.md`](V2_1.md) |
| **Publicado em** | 24/06/2026 — deploy Netlify `6a3d525f` @ `07c7a7e` (Voa, segmentos, changelog, ROI) |

**Inclui (além de v2.0.0):**

- **Segurança pós-POC:** proxy HMAC, rate limit login/MFA, headers CSP/HSTS, RBAC users ADMIN
- **Assistente operacional:** chat nos 4 portais, mock 350+ gatilhos, confirmação de ações
- **VET / Pet:** entidade Pet, ficha clínica, vacinas, walk-in com pet
- **Change management A–F:** reversão faturas, PPU, estoque, restore via timeline
- **Importação JSON/CSV:** interchange de cadastros (patients, providers, companies, procedures)
- **Agendamento flexível:** procedimento sem prestador obrigatório
- **Landing:** CTA WhatsApp, SEO, tags marketing, identidade Energia Brasileira, **changelog #novidades**
- **Segmentos:** cores por nicho (#122), login demo automático (#123), ROI ~91% (#100)
- **Voa Health Fase 1:** embed no atendimento, importação PEP ([#95](https://github.com/Piulres/sistema-bibi/pull/95))
- **OpenAPI v2.1:** +15 paths (assistente, pets, import, change-mgmt, voa)
- **Versão na UI:** `Sistema Bibi - ServiceOS v2.1` em title, badges e Swagger

**Testes:** 395 Vitest · 128 E2E · `docs:verify` · `db:verify` · `pre-release` OK.

---

### `v2.0.0` — Sistema Bibi - ServiceOS (multi-nicho) *(substituído por v2.1.0)*

| Campo | Valor |
|-------|-------|
| **Tag git** | `v2.0.0` |
| **Commit** | `b661b39` |
| **PRs** | [#101](https://github.com/Piulres/sistema-bibi/pull/101), [#106](https://github.com/Piulres/sistema-bibi/pull/106)–[#108](https://github.com/Piulres/sistema-bibi/pull/108), [#111](https://github.com/Piulres/sistema-bibi/pull/111), [#115](https://github.com/Piulres/sistema-bibi/pull/115), [#116](https://github.com/Piulres/sistema-bibi/pull/116) |
| **Publicado em** | 23/06/2026 — deploy Netlify `6a3abdc1` (redeploy docs/ROI) |

**Inclui (além de v1.3 estoque):**

- Marca oficial **Sistema Bibi - ServiceOS** (`src/lib/platform.ts`)
- ServiceOS multi-nicho: `Tenant.niche`, `useLabels()`, landing por segmento
- Roteamento por tenant slug (`bibi_segment`) da landing ao login
- Tenants demo: PetCare, Smile, Lex, Zen, EduPrime + Horizonte Saúde
- `db:verify` no `pre-release` · massas demo + operation validadas
- Fix mobile: cookie de segmento via API client-side
- Documentação reorganizada (`docs/segmentos/`, prompts, índice)
- **ROI recalculado (~87%)** — `docs/plataforma/ROI_REFERENCIA.md`
- **Auditoria de veracidade** — pesquisa FATO/INFERÊNCIA, fluxos 13 módulos interno

**Testes:** 163 Vitest · `db:verify` demo + operation · `pre-release` OK.

**Deploy anterior (mesmo v2.0.0):** `6a3a9973` @ `49edb90`.

---

### `v1.2.0` — integração completa *(substituído)*

| Campo | Valor |
|-------|-------|
| **Tag git** | `v1.2.0` |
| **Commit** | `485819a` |
| **PRs** | [#72](https://github.com/Piulres/sistema-bibi/pull/72), [#83](https://github.com/Piulres/sistema-bibi/pull/83), [#84](https://github.com/Piulres/sistema-bibi/pull/84), [#85](https://github.com/Piulres/sistema-bibi/pull/85), [#86](https://github.com/Piulres/sistema-bibi/pull/86), [#88](https://github.com/Piulres/sistema-bibi/pull/88) |
| **Publicado em** | 23/06/2026 — deploy Netlify `6a39d446` |

**Inclui:**

- **Care Chart (#86):** perfil clínico, medicação, exames, protocolos
- **Cadastros v1.1 (#72):** CPF/CNPJ, campos B2B, precificação
- **Portais (#83):** a11y, mobile, dashboard prestador, RBAC interno, rotas beneficiário
- **Auditoria (#84):** timeline universal, precificação B2B, edição de assinaturas
- **Exportações (#85):** PDF/Excel/CSV em faturamento, prontuários, extratos, relatórios
- **Homepage (#88):** landing moderna

**Testes:** 136 Vitest + E2E cadastros, mobile, exports.

---

### `v1.1.0` — Care Chart *(substituído)*

| Campo | Valor |
|-------|-------|
| **Tag git** | `v1.1.0` |
| **Commit** | `8c8cd01` |
| **PR** | [#86](https://github.com/Piulres/sistema-bibi/pull/86) |

---

### `v1.0.2` — identidade plataforma vs clínicas *(substituído)*

| Campo | Valor |
|-------|-------|
| **Tag git** | `v1.0.2` |
| **Commit** | `e30b2b0` |

---

## Documentação por versão

| Versão | Doc | Estado |
|--------|-----|--------|
| **1.0.x** | [`V1_0.md`](V1_0.md) | Histórico |
| **1.1.x** | [`V1_1.md`](V1_1.md) | Care Chart (incorporado em 1.2.0) |
| **1.2.x** | [`V1_2.md`](V1_2.md) | Histórico (substituído por v2.0) |
| **1.3.x** | [`V1_3.md`](V1_3.md) | Incorporado em **v2.0.0** (estoque médico) |
| **2.0.x** | [`V2_0.md`](V2_0.md) · [`V2_0_ARCHITECTURE.md`](V2_0_ARCHITECTURE.md) | Histórico — base multi-nicho |
| **2.1.x** | [`V2_1.md`](V2_1.md) | Histórico — substituído por v2.2.0 |
| **2.2.x** | onboarding tour | Histórico — substituído por v2.3.0 |
| **3.0.x** | [`V3_0.md`](V3_0.md) | ⏳ **`v3.0.7` em publicação** — drawer mobile + dashboard + exports |
| **2.6.x** | [`V2_6.md`](V2_6.md) | Histórico — CEDIG pontes (substituído por v3.0.0) |
| **2.5.x** | [`V2_5.md`](V2_5.md) | Empilhado em v2.6.0 — login tenant/portal |
| **2.4.x** | [`V2_4.md`](V2_4.md) | Histórico — substituído por v2.6.0 (CEDIG gestão clínica) |
| **2.3.x** | [`V2_3.md`](V2_3.md) | Histórico — title/footer · assistente · obras |
| **1.4.x** | [`plataforma/VOA_INTEGRATION.md`](../plataforma/VOA_INTEGRATION.md) · [`plataforma/VOA_INTEGRATION.md`](../plataforma/VOA_INTEGRATION.md) | ✅ Fase 1 em **v2.1.0** ([#95](https://github.com/Piulres/sistema-bibi/pull/95)) |

---

## Pacotes validados (histórico de integração)

---

### `v1.3.0` — Estoque Médico *(incorporado em v2.0.0)*

| Campo | Valor |
|-------|-------|
| **Versão** | `1.3.0` (`package.json`) |
| **Commit** | `e372c01` (feat) + `6c1770a` (docs release) |
| **PR** | [#93](https://github.com/Piulres/sistema-bibi/pull/93) |
| **Doc** | [`V1_3.md`](V1_3.md) |
| **Validação** | `npm run pre-release` ✅ · `tests/api/stock.test.ts` 8/8 |

**Inclui:**

- Gestão de estoque médico (produtos, lotes, validade, movimentações)
- Alertas operacionais (estoque mínimo, vencimento, quarentena)
- Kits de materiais por procedimento com baixa automática no Pay Per Use
- Dispensação no atendimento do prestador
- RBAC interno (`estoque` para ADMIN e RECEPCAO)

| Versão | Commit | Data (UTC) | Estado |
|--------|--------|------------|--------|
| **`v2.0.0`** | `49edb90` | 23/06/2026 | ✅ Histórico — substituído (deploy `6a3a9973`) |
| **`v1.3.0`** | `e372c01` | 23/06/2026 | ✅ Incorporado em v2.0.0 |
| **`v1.2.0`** | `485819a` | 23/06/2026 | ✅ Substituído |
| `v1.1.0` | `8c8cd01` | 22/06/2026 | ✅ Substituído |
| `v1.0.2` | `e30b2b0` | 22/06/2026 | ✅ Substituído |
| `v1.0.1` | `e4d8a43` | 22/06/2026 | ✅ Substituído |
| `v1.0.0` | `685cc21` | 22/06/2026 | ✅ Substituído |

---

## Rollback para versão anterior

A Netlify **não faz rollback automático de código** — é preciso **republicar** um build de uma tag/commit anterior.

### Procedimento (humano)

```bash
# 1. Escolher a tag (ex.: voltar de v2.0.0 para v1.2.0)
git fetch --tags
git checkout v1.2.0          # ou: git checkout 485819a

# 2. Rebuild local (obrigatório — schema/seed podem diferir)
npm ci
npm run pre-release

# 3. Deploy com build integrado do CLI (não usar --no-build)
npx netlify deploy --prod --message "rollback: v1.2.0"

# 4. Smoke test — chunk CSS deve retornar 200 (substitua pelo hash do HTML atual)
curl -s https://sistema-bibi.netlify.app/ | rg -o '/_next/static/chunks/[^"]+\.css' | head -1 | xargs -I{} curl -s -o /dev/null -w "%{http_code} {}\n" "https://sistema-bibi.netlify.app{}"

# 5. Atualizar este arquivo (RELEASES.md) e AGENTS.md com versão em produção
# 6. Opcional: git checkout main && git push (main continua em v2.0; só produção volta)
```

### O que muda em cada rollback

| De → Para | Código | Banco produção | Sessões / login |
|-----------|--------|----------------|-----------------|
| v2.0 → v1.2 | Perde multi-nicho, labels, landing por nicho | SQLite no Blobs **não reverte** sozinho — dados criados com schema v2 podem falhar | Cookies válidos se `SESSION_SECRET` igual |
| v2.0 → v1.3 | Perde só ServiceOS; mantém estoque | Idem — `db:push` no build alinha schema do deploy | Idem |
| Qualquer → anterior | Build da tag escolhida | **Modo demo:** restaurar via `/interno/seguranca` · **Operação:** backup manual | Usuários precisam relogar se schema de User mudar |

### Riscos

1. **Schema Prisma** — v2.0 adiciona `Tenant.niche`, `Tenant.labels`, `Procedure.serviceType`. Rollback para v1.2 **sem** reset do banco pode gerar erro se colunas forem obrigatórias no código antigo (v1.2 ignora campos extras no SQLite em geral, mas seed/bootstrap difere).
2. **Dados de operação** — modo `operation` em Blobs persiste entre deploys; rollback de código **não** apaga dados.
3. **Tags git** — `v1.2.0`, `v1.1.0`, etc. permanecem no repositório; rollback é checkout + rebuild + deploy.
4. **Cota Netlify** — cada deploy consome minutos; validar local com `pre-release` antes de publicar.

### Rollback “só documentação”

Se o deploy falhar antes de publicar, basta **não** atualizar `RELEASES.md` como publicado — produção permanece na versão anterior.

---

## Changelog na landing (home)

A seção **Novidades** (`/#novidades`) apresenta o changelog para demonstrações comerciais.

| Momento | Arquivo |
|---------|---------|
| Ao fechar pacote | `src/lib/landing/changelog-content.ts` |
| Junto com release | `src/lib/platform.ts`, `package.json` |
| Instruções completas | [`../plataforma/LANDING_CHANGELOG.md`](../plataforma/LANDING_CHANGELOG.md) |

**Regra:** quando este arquivo marca uma versão como **em produção**, a home deve exibir a mesma versão em destaque. `npm run docs:verify` valida o alinhamento.

---

## Publicar um pacote

```bash
git checkout dev && git pull && npm run pre-release
git checkout main && git pull && git merge dev && npm run pre-release
npx netlify deploy --prod --message "vX.Y.Z: descrição"
git tag -a vX.Y.Z -m "Release X.Y.Z"
git push origin main && git push origin vX.Y.Z
git checkout dev && git merge main && git push origin dev
```

> **Importante (Next.js 16 + `@netlify/plugin-nextjs`):** não use `--no-build`. Esse flag
> publica HTML sem os assets `/_next/static/*` na CDN (front quebrado). O build integrado do
> `netlify deploy --prod` empacota corretamente via plugin.

---

## Links

- [`../plataforma/WORKFLOW_CURSOR.md`](../plataforma/WORKFLOW_CURSOR.md)
- [`../plataforma/OPERACOES.md`](../plataforma/OPERACOES.md)
- [`../plataforma/DEPLOY_NETLIFY.md`](../plataforma/DEPLOY_NETLIFY.md)
