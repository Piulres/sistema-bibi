# Releases — Pacotes fechados do Sistema Bibi

Registro oficial do que está **em produção**, do que está **pendente na `main`**
(após merge de `dev`) e do histórico de publicações. Use este arquivo como fonte
única de verdade — não confie em “deploy automático” para saber o que está no ar.

**Fluxo de branches:** features integram em `dev` → release merge `dev` → `main` → deploy manual.

**Produção:** https://sistema-bibi.netlify.app

---

## Status agora (22/06/2026)

| Item | Valor |
|------|-------|
| **Versão em produção** | **1.0.0** (`de88c0e`) |
| **Próximo deploy (linha 1.0)** | **1.0.1** — commit `a31e195` na `dev` |
| Site produção | https://sistema-bibi.netlify.app |
| `main` | `de88c0e` — aguardando merge `dev` → `main` |
| `dev` | `a31e195` — integração (v1.0.1 + futura v1.1) |
| Tag git em produção | `v1.0.0` |
| Validação `dev` | `npm run pre-release` · 101 unit · 44+ E2E |

---

## Pacote em produção (fechado)

### `v1.0.0` — primeira versão estável

| Campo | Valor |
|-------|-------|
| **Tag git** | `v1.0.0` |
| **Commit** | `de88c0e` |
| **Publicado em** | 22/06/2026 — deploy `6a393af3` |
| **Escopo** | POC consolidada — PRs #64–#66 (walk-in, mapas CRUD, melhorias visuais/fluxo) |

---

## Próximo pacote — produção (linha 1.0)

### `v1.0.1` — agenda prestador + demo/operação

| Campo | Valor |
|-------|-------|
| **Versão** | `1.0.1` |
| **Commit** | `a31e195` (merge `dev`) |
| **Branch** | `dev` → merge `main` → deploy manual |
| **Docs** | [`V1_0.md`](V1_0.md) |
| **PRs incluídos** | #69 agenda/histórico prestador · #70 dev-first · #71 dual SQLite demo/operação |
| **Checklist** | `npm run pre-release` → merge `dev`→`main` → cota OK → `deploy --prod --no-build` → tag `v1.0.1` → atualizar esta seção |

**Não inclui:** cadastros v1.1 (PR #72) — permanece só na `dev`.

---

## Em desenvolvimento — somente `dev` (não produção)

### `v1.1.0` — cadastros de mercado + CRUD confiável

| Campo | Valor |
|-------|-------|
| **Versão alvo** | `1.1.0` |
| **Branch** | `dev` (após merge PR #72) |
| **PR** | #72 `cursor/v11-crud-cadastros-82f2` |
| **Docs** | [`V1_1.md`](V1_1.md) |
| **Produção** | ❌ Não publicar neste ciclo |

---

## Documentação por versão

| Versão | Doc | Estado |
|--------|-----|--------|
| **1.0.x** | [`V1_0.md`](V1_0.md) | `v1.0.1` pendente deploy |
| **1.1.x** | [`V1_1.md`](V1_1.md) | Só `dev` |

---

## Histórico de releases

| Versão / Pacote | Commit | Data (UTC) | Estado |
|-----------------|--------|------------|--------|
| **`v1.0.0`** | `de88c0e` | 22/06/2026 | ✅ **Em produção** (será substituído por 1.0.1) |
| `bibi-poc-2026-06-22c` | `32dad64` | 22/06/2026 | ✅ Substituído |
| `bibi-poc-2026-06-22b` | `92348ba` | 22/06/2026 | ✅ Substituído |
| `bibi-poc-2026-06-22a` | `beeb894` | 22/06/2026 | ✅ Substituído |
| `bibi-poc-2026-06-21b` | `94c0f67` | 21/06/2026 | ✅ Substituído |
| `bibi-poc-2026-06-21a` | *(vários)* | 21/06/2026 | ⚠️ Builds Git falharam |

### Deploys Git que falharam (não contam como release)

| Commit | PR | Motivo |
|--------|-----|--------|
| `94c0f67` | #27 | Build exit code 2 |
| `beeb894` | #28 | Build Git falhou (CLI funcionou) |

Detalhes: [`HISTORICO_2026-06-21.md`](HISTORICO_2026-06-21.md)

---

## Publicar um pacote

Fluxo **manual** — só quando você decidir. Agentes Cursor **não** devem
executar deploy sem pedido explícito.

### 1. Preparar na `main`

```bash
git checkout main
git pull origin main
npm run pre-release
```

### 2. Verificar cota Netlify

```bash
curl -s -o /dev/null -w "%{http_code}" https://sistema-bibi.netlify.app/
# Se retornar 503 com usage_exceeded → aguardar reset ou upgrade
```

### 3. Publicar (manual)

```bash
npx netlify login    # se necessário
npx netlify link     # site sistema-bibi
npx netlify build    # build local com plugins Next.js (incluído no pre-release)
npx netlify deploy --prod --no-build --message "v1.0.1: agenda prestador + demo/operação"
```

### 4. Fechar o pacote (atualizar este arquivo)

1. Copie a seção “Próximo pacote” para “Pacote em produção”.
2. Limpe “Próximo pacote” com o novo rascunho.
3. Adicione linha no “Histórico de releases”.
4. Commit: `docs(release): fecha pacote vX.Y.Z`

### 5. Tag (recomendado para versões estáveis)

```bash
git tag -a v1.0.1 -m "Release 1.0.1 — agenda prestador + demo/operação"
git push origin main
git push origin v1.0.1
```

---

## Convenção de nomes

A partir de **1.0.0**, releases estáveis usam **versionamento semântico**:

```
vMAJOR.MINOR.PATCH   (ex.: v1.0.0, v1.1.0, v1.0.1)
```

Pacotes POC anteriores (`bibi-poc-AAAA-MM-DDx`) permanecem no histórico.

---

## O que **não** fazer

| Ação | Por quê |
|------|---------|
| Deploy a cada PR mergeado | Queima cota Netlify + tokens de agente |
| `netlify deploy --prod` em agente sem pedido | Custo e risco desnecessários |
| Confiar só no deploy Git | Histórico de falhas — validar com `pre-release` |
| `npm run db:reset` em agente | Bloqueado — use `db:push && db:seed` |

---

## Links

- Workflow Cursor (dev local): [`WORKFLOW_CURSOR.md`](WORKFLOW_CURSOR.md)
- Mapa de operações: [`OPERACOES.md`](OPERACOES.md)
- Deploy Netlify (troubleshooting): [`DEPLOY_NETLIFY.md`](DEPLOY_NETLIFY.md)
- Histórico 21/06: [`HISTORICO_2026-06-21.md`](HISTORICO_2026-06-21.md)
- Evidências visuais: [`evidencias/README.md`](evidencias/README.md)
