# Releases — Pacotes fechados do Sistema Bibi

Registro oficial do que está **em produção**, do que está **pendente na `main`**
e do histórico de publicações. Use este arquivo como fonte única de verdade —
não confie em “deploy automático” para saber o que está no ar.

**Produção:** https://sistema-bibi.netlify.app

---

## Status agora (22/06/2026)

| Item | Valor |
|------|-------|
| Site | ✅ **HTTP 200** — online |
| Pacote em produção | `bibi-poc-2026-06-22c` → commit `32dad64` |
| Deploy Netlify | `6a38b0693dfc26b5899c3be7` |
| `main` | `8c6007a` — **alinhada com produção** (docs pós-release #54) |
| Validação local | `npm run pre-release` |

---

## Pacote em produção (fechado)

### `bibi-poc-2026-06-22c`

| Campo | Valor |
|-------|-------|
| **Tag git** | *(não criada — deploy via CLI)* |
| **Commit** | `32dad64` — merge PR #52 |
| **Publicado em** | 22/06/2026 ~03:50 UTC (deploy CLI `--no-build`) |
| **Método** | `npx netlify build` local + `npx netlify deploy --prod --no-build` |
| **Site** | `sistema-bibi` |
| **Autorizado por** | Usuário (“Aplicar correção”) |

**Inclui (desde `bibi-poc-2026-06-22b`):**

- Demo reset habilitado em POC Netlify (`ALLOW_DEMO_RESET` + `NETLIFY=true` no `netlify.toml`)
- Redirect `/interno/faturamento` → `/interno` (corrige 404)
- `autoComplete` nos formulários de login (aviso de console)
- Fix CI: `DATABASE_URL` nos jobs unit/e2e + `globalSetup` Vitest + normalização SQLite em `db.ts`

**Validação pré-deploy:**

- `npm run test` — 54/54
- `npm run pre-release` — OK
- Smoke: landing 200, login API 200, `/interno/faturamento` → 307

---

## Próximo pacote (pendente)

*(Nenhum — `main` está alinhada com produção. Novos merges acumulam aqui antes do próximo fechamento.)*

### `bibi-poc-YYYY-MM-DDa` *(rascunho)*

| Campo | Valor |
|-------|-------|
| **Commit alvo** | — |
| **PRs desde produção** | — |
| **Checklist** | `npm run pre-release` → cota OK → `deploy --prod --no-build` |

---

## Histórico de releases

| Pacote | Commit | Data (UTC) | Método | Estado |
|--------|--------|------------|--------|--------|
| `bibi-poc-2026-06-22c` | `32dad64` | 22/06 ~03:50 | CLI `--prod --no-build` | ✅ **Em produção** |
| `bibi-poc-2026-06-22b` | `92348ba` | 22/06 ~02:36 | CLI `--prod --no-build` | ✅ Substituído |
| `bibi-poc-2026-06-22a` | `beeb894` | 22/06 ~00:01 | CLI `--prod` | ✅ Substituído |
| `bibi-poc-2026-06-21b` | `94c0f67` | 21/06 23:37 | CLI `--prod` | ✅ Substituído |
| `bibi-poc-2026-06-21a` | *(vários)* | 21/06 18:35+ | Git + CLI | ⚠️ Builds Git falharam |

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
npx netlify build    # build local com plugins Next.js
npx netlify deploy --prod --no-build --message "bibi-poc-YYYY-MM-DDx: <resumo>"
```

### 4. Fechar o pacote (atualizar este arquivo)

1. Copie a seção “Próximo pacote” para “Pacote em produção”.
2. Limpe “Próximo pacote” com o novo rascunho.
3. Adicione linha no “Histórico de releases”.
4. Commit: `docs(release): fecha pacote bibi-poc-YYYY-MM-DDx`

### 5. Tag opcional

```bash
git tag -a bibi-poc-YYYY-MM-DDx -m "Release bibi-poc-YYYY-MM-DDx"
git push origin bibi-poc-YYYY-MM-DDx
```

---

## Convenção de nomes

```
bibi-poc-AAAA-MM-DD[a|b|c]
```

- `AAAA-MM-DD` — data da publicação
- sufixo `a`, `b`, `c` — múltiplos pacotes no mesmo dia

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
