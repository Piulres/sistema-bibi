# Releases — Pacotes fechados do Sistema Bibi

Registro oficial do que está **em produção**, do que está **pendente na `dev`**
e do histórico de publicações. Use este arquivo como fonte única de verdade.

**Fluxo de branches:** features integram em `dev` → release merge `dev` → `main` → deploy.

**Produção:** https://sistema-bibi.netlify.app

---

## Status agora (23/06/2026)

| Item | Valor |
|------|-------|
| **Versão em produção (Netlify)** | **1.2.0** — último deploy `6a39d446` *(atualizar após deploy v2.0)* |
| **Versão validada na `main`** | **2.0.0** (`7f5d876` + bump `package.json`) |
| `main` / `dev` | **v2.0.0 ServiceOS** — merge `dev` → `main` concluído |
| **Tag git mais recente** | **`v2.0.0`** *(após tag)* — anterior: `v1.2.0` |
| **Próximo passo** | `npm run pre-release` → `npx netlify deploy --prod --no-build` |
| Feature paralela | **v1.4.0** Voa — branch `integracao-voa` ([PR #95](https://github.com/Piulres/sistema-bibi/pull/95)) |

### Sincronização de ambientes

| Ambiente | Branch | Conteúdo |
|----------|--------|----------|
| **Integração** | `dev` | **v2.0.0** ServiceOS |
| **Release** | `main` | **v2.0.0** — aguardando deploy Netlify |
| **Netlify** | último deploy manual | Ainda **v1.2.0** até publicar v2.0 |
| **Feature** | `integracao-voa` | **v1.4.0** Voa (isolado) |

### Tags git (histórico)

| Tag | Commit aprox. | Conteúdo |
|-----|---------------|----------|
| **`v2.0.0`** | `7f5d876` | ServiceOS multi-nicho + v1.3 estoque incorporado |
| `v1.2.0` | `485819a` | Care Chart, exports, homepage — **em produção hoje** |
| `v1.1.0` | `8c8cd01` | Care Chart (substituído) |
| `v1.0.2` | `e30b2b0` | White label plataforma vs clínicas |
| `v1.0.1` | `e4d8a43` | Deploy Netlify inicial |
| `v1.0.0` | `685cc21` | POC inicial |

---

## Pacote em produção (fechado)

### `v1.2.0` — integração completa *(substituído na Netlify após deploy v2.0)*

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
| **1.3.x** | [`V1_3.md`](V1_3.md) | Incorporado em **v2.0.0** (estoque médico) |
| **2.0.x** | [`V2_0.md`](V2_0.md) · [`V2_0_ARCHITECTURE.md`](V2_0_ARCHITECTURE.md) | ✅ Validado na `main` — **pendente deploy** |
| **1.4.x** | [`PLANO_V1_4_VOA.md`](PLANO_V1_4_VOA.md) · [`VOA_INTEGRATION.md`](VOA_INTEGRATION.md) | 🚧 Branch `integracao-voa` ([PR #95](https://github.com/Piulres/sistema-bibi/pull/95)) |

---

## Pacote validado (`main`) — pendente deploy

### `v2.0.0` — ServiceOS multi-nicho

| Campo | Valor |
|-------|-------|
| **Versão** | `2.0.0` (`package.json`) |
| **Commit** | `7f5d876` (ServiceOS) + merge v1.3 estoque |
| **PR** | [#101](https://github.com/Piulres/sistema-bibi/pull/101) |
| **Doc** | [`V2_0.md`](V2_0.md) · [`V2_0_ARCHITECTURE.md`](V2_0_ARCHITECTURE.md) |
| **Tag** | `v2.0.0` |

**Inclui (além de todo v1.3 estoque):**

- `Tenant.niche` + `Tenant.labels` — dicionário por cliente
- `useLabels()` + `NICHE_MASTER_LABELS` — vocabulário dinâmico na UI
- Landing segmentada por nicho (`/?niche=VET`, domínio customizado)
- Seed multi-nicho: PetCare, Smile, Lex, Zen, EduPrime
- Procedimentos demo: Banho e Tosa (R$ 150), Consulta Odontológica (R$ 350), Hora Técnica (R$ 500)
- Documentação ServiceOS alinhada (README, BENCHMARK, FLUXOS, pesquisa)

**Testes:** `tests/unit/niche.test.ts` — 14 testes · `pre-release` obrigatório antes do deploy.

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
| **`v2.0.0`** | `7f5d876` | 23/06/2026 | ⏳ Validado — **pendente deploy** |
| **`v1.3.0`** | `e372c01` | 23/06/2026 | ✅ Incorporado em v2.0.0 |
| **`v1.2.0`** | `485819a` | 23/06/2026 | ✅ **Em produção** (até deploy v2.0) |
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

# 3. Deploy sem rebuild remoto (economiza cota)
npx netlify deploy --prod --no-build --message "rollback: v1.2.0"

# 4. Atualizar este arquivo (RELEASES.md) e AGENTS.md com versão em produção
# 5. Opcional: git checkout main && git push (main continua em v2.0; só produção volta)
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
4. **Cota Netlify** — cada deploy consome minutos; usar `--no-build` após `pre-release` local.

### Rollback “só documentação”

Se o deploy falhar antes de publicar, basta **não** atualizar `RELEASES.md` como publicado — produção permanece na versão anterior.

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
