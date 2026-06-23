# Releases — Pacotes fechados do Sistema Bibi

Registro oficial do que está **em produção**, do que está **pendente na `dev`**
e do histórico de publicações. Use este arquivo como fonte única de verdade.

**Fluxo de branches:** features integram em `dev` → release merge `dev` → `main` → deploy.

**Produção:** https://sistema-bibi.netlify.app

---

## Status agora (23/06/2026)

| Item | Valor |
|------|-------|
| **Versão em produção** | **1.2.0** (`55481be`) |
| **Deploy Netlify** | `6a39d446` (23/06/2026) |
| `main` | `6c1770a` — **v1.3.0** Estoque validado (`pre-release` OK) |
| `dev` | Integração — **v2.0 ServiceOS** em merge (PR [#101](https://github.com/Piulres/sistema-bibi/pull/101)) |
| **Tag git em produção** | **`v1.2.0`** |
| **Próximo deploy** | **v1.3.0** — `npx netlify deploy --prod` (humano) |
| **Em desenvolvimento** | **v2.0 ServiceOS** — multi-nicho, labels, landing segmentada |
| Feature paralela | **v1.4.0** Voa — branch `integracao-voa` ([PR #95](https://github.com/Piulres/sistema-bibi/pull/95)) |

### Sincronização de ambientes

| Ambiente | Branch | Conteúdo |
|----------|--------|----------|
| **Integração** | `dev` | **v1.3.0** — **novas features aqui** |
| **Release** | `main` | **v1.3.0** validado — aguardando deploy |
| **Feature** | `integracao-voa` | **v1.4.0** Voa (isolado) |
| **Netlify** | `main` (último deploy) | Ainda **v1.2.0** em produção |

---

## Pacote em produção (fechado)

### `v1.2.0` — integração completa

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
| **1.2.x** | [`V1_2.md`](V1_2.md) | ✅ **`v1.2.0` em produção** |
| **1.3.x** | [`V1_3.md`](V1_3.md) | ✅ Validado em `main` — **pendente deploy** |
| **2.0.x** | [`V2_0.md`](V2_0.md) · [`V2_0_ARCHITECTURE.md`](V2_0_ARCHITECTURE.md) | 🚧 **Em desenvolvimento** na `dev` (ServiceOS multi-nicho) |
| **1.4.x** | [`PLANO_V1_4_VOA.md`](PLANO_V1_4_VOA.md) · [`VOA_INTEGRATION.md`](VOA_INTEGRATION.md) | 🚧 Branch `integracao-voa` ([PR #95](https://github.com/Piulres/sistema-bibi/pull/95)) |

---

## Pacote validado (`main`) — pendente deploy

### `v1.3.0` — Estoque Médico

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
| **`v1.3.0`** | `e372c01` | 23/06/2026 | ⏳ Validado — **pendente deploy** |
| **`v1.2.0`** | `485819a` | 23/06/2026 | ✅ **Em produção** |
| `v1.1.0` | `8c8cd01` | 22/06/2026 | ✅ Substituído |
| `v1.0.2` | `e30b2b0` | 22/06/2026 | ✅ Substituído |
| `v1.0.1` | `e4d8a43` | 22/06/2026 | ✅ Substituído |
| `v1.0.0` | `685cc21` | 22/06/2026 | ✅ Substituído |

---

## Pacote em desenvolvimento (`dev`) — v2.0 ServiceOS

### `v2.0.0` — ServiceOS multi-nicho

| Campo | Valor |
|-------|-------|
| **Codinome** | ServiceOS |
| **PR** | [#101](https://github.com/Piulres/sistema-bibi/pull/101) |
| **Doc** | [`V2_0.md`](V2_0.md) · [`V2_0_ARCHITECTURE.md`](V2_0_ARCHITECTURE.md) |
| **Estado** | 🚧 Integrado na `dev` — **não publicado** |

**Inclui:**

- `Tenant.niche` + `Tenant.labels` (JSON) — dicionário por cliente
- `useLabels()` + `NICHE_MASTER_LABELS` — vocabulário dinâmico na UI
- Landing segmentada por nicho (`/?niche=VET`, domínio customizado)
- Seed: PetCare, Smile Odonto, Lex & Partners, Zen Studio, EduPrime
- Procedimentos demo: Banho e Tosa (R$ 150), Consulta Odontológica (R$ 350), Hora Técnica Jurídica (R$ 500)
- Nav dinâmica (Prestador, Beneficiário, Cadastros internos)
- Documentação alinhada: README, BENCHMARK, FLUXOS, JORNADA, pesquisa, OPERACOES

**Testes:** `tests/unit/niche.test.ts` — 14 testes.

**Não inclui (roadmap):** homepage 100% custom por tenant, migração completa de strings fixas, deploy produção.

---

## Publicar um pacote

```bash
git checkout dev && git pull && npm run pre-release
git checkout main && git pull && git merge dev && npm run pre-release
npx netlify deploy --prod --build --message "vX.Y.Z: descrição"
git tag -a vX.Y.Z -m "Release X.Y.Z"
git push origin main && git push origin vX.Y.Z
git checkout dev && git merge main && git push origin dev
```

---

## Links

- [`WORKFLOW_CURSOR.md`](WORKFLOW_CURSOR.md)
- [`OPERACOES.md`](OPERACOES.md)
- [`DEPLOY_NETLIFY.md`](DEPLOY_NETLIFY.md)
