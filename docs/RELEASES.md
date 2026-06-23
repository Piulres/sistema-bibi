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
| `main` | `55481be` — release / produção |
| `dev` | `e372c01` — **v1.3.0** Estoque Médico (**base para novas features**) |
| **Tag git em produção** | **`v1.2.0`** |
| Próximo release | **v1.3.0** — merge `dev` → `main` quando publicar |
| Feature paralela | **v1.4.0** Voa Health — branch `integracao-voa` ([PR #95](https://github.com/Piulres/sistema-bibi/pull/95)) |

### Sincronização de ambientes

| Ambiente | Branch | Conteúdo |
|----------|--------|----------|
| **Integração** | `dev` | **v1.3.0** Estoque — **novas features aqui** |
| **Feature** | `integracao-voa` | **v1.4.0** Voa Health (isolado, PR → `dev`) |
| **Release / produção** | `main` | Pacote **v1.2.0** completo |
| **Netlify** | `main` | Espelha produção |

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
| **1.3.x** | [`V1_3.md`](V1_3.md) | ✅ Integrado em `dev` (`e372c01`) |
| **1.4.x** | [`PLANO_V1_4_VOA.md`](PLANO_V1_4_VOA.md) · [`VOA_INTEGRATION.md`](VOA_INTEGRATION.md) | 🚧 Branch `integracao-voa` ([PR #95](https://github.com/Piulres/sistema-bibi/pull/95)) |

---

## Pacote pendente (`integracao-voa`)

### `v1.4.0` — Integração Voa Health

| Campo | Valor |
|-------|-------|
| **Versão** | `1.4.0` (`package.json`) |
| **Branch** | `integracao-voa` |
| **Base** | `dev` (v1.3.0 Estoque) |
| **Doc** | [`PLANO_V1_4_VOA.md`](PLANO_V1_4_VOA.md) |
| **Validação** | `npm run pre-release` + `node scripts/voa-live-smoke.mjs` |

**Inclui (Fase 1):**

- Plugin Voa Health no atendimento prestador (aba Assistente IA)
- Importação automática de documentos no PEP (`VOA_DOCUMENT_IMPORTED`)
- APIs `/api/prestador/appointments/[id]/voa` e `/voa/import`
- Env `VOA_ENABLED` + `VOA_INTEGRATION_TOKEN`

---

## Pacote integrado (`dev`)

### `v1.3.0` — Estoque Médico

| Campo | Valor |
|-------|-------|
| **Versão** | `1.3.0` (`package.json`) |
| **Branch** | `cursor/estoque-medico-0f4a` → `dev` (`e372c01`) |
| **Doc** | [`V1_3.md`](V1_3.md) |
| **Validação** | `npm run pre-release` |

**Inclui:**

- Gestão de estoque médico (produtos, lotes, validade, movimentações)
- Alertas operacionais (estoque mínimo, vencimento, quarentena)
- Kits de materiais por procedimento com baixa automática no Pay Per Use
- Dispensação no atendimento do prestador
- RBAC interno (`estoque` para ADMIN e RECEPCAO)

| Versão | Commit | Data (UTC) | Estado |
|--------|--------|------------|--------|
| **`v1.2.0`** | `485819a` | 23/06/2026 | ✅ **Em produção** |
| `v1.1.0` | `8c8cd01` | 22/06/2026 | ✅ Substituído |
| `v1.0.2` | `e30b2b0` | 22/06/2026 | ✅ Substituído |
| `v1.0.1` | `e4d8a43` | 22/06/2026 | ✅ Substituído |
| `v1.0.0` | `685cc21` | 22/06/2026 | ✅ Substituído |

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
