# Releases — Pacotes fechados do Sistema Bibi

Registro oficial do que está **em produção**, do que está **pendente na `main`**
e do histórico de publicações. Use este arquivo como fonte única de verdade —
não confie em “deploy automático” para saber o que está no ar.

**Produção:** https://sistema-bibi.netlify.app

---

## Status agora (22/06/2026)

| Item | Valor |
|------|-------|
| Site | ❌ **503 `usage_exceeded`** — cota Netlify esgotada |
| Pacote em produção | `bibi-poc-2026-06-22a` → commit `beeb894` (PR #28) |
| `main` local | `158b69f` (PR #39) — **não publicado** |
| Deploy Git automático | ⚠️ **Desligar** — ver [`WORKFLOW_CURSOR.md`](WORKFLOW_CURSOR.md) |
| Validação local | `npm run pre-release` |

> O site caiu por **cota**, não por regressão de código. Aguarde reset do plano
> Netlify ou faça upgrade antes de publicar o próximo pacote.

---

## Pacote em produção (fechado)

### `bibi-poc-2026-06-22a`

| Campo | Valor |
|-------|-------|
| **Tag git** | *(não criada — deploy via CLI)* |
| **Commit** | `beeb894` — merge PR #28 |
| **Publicado em** | 22/06/2026 ~00:01 UTC (deploy CLI) |
| **Método** | `npx netlify deploy --prod` |
| **Site** | `sistema-bibi` |

**Inclui (até PR #28):**

- Tiers 1–4 completos (PIX mock, RBAC, MFA, telemedicina, TISS)
- Plugin Blobs regional + Prisma `rhel-openssl-3.0.x`
- Design system + white label (Blobs)
- Docs + evidências dos fluxos

**Não inclui (na `main` mas fora de produção):**

- PRs #29–#39: fixes CI GitHub, seed 50 PJ, massa operacional, landing moderna, etc.
- Ver diff: `git log beeb894..main --oneline`

---

## Próximo pacote (pendente)

### `bibi-poc-2026-06-22b` *(rascunho — não publicar ainda)*

| Campo | Valor |
|-------|-------|
| **Commit alvo** | `158b69f` (head da `main` em 22/06) |
| **PRs desde produção** | #29–#39 |
| **Destaques** | Builds Git corrigidos, seed em escala (50 PJ, VitaCare), landing moderna |
| **Checklist** | Ver seção [Publicar um pacote](#publicar-um-pacote) abaixo |

Antes de publicar:

```bash
npm run pre-release          # lint + build Netlify local (sem publicar)
# Só depois, manualmente:
npx netlify deploy --prod    # quando cota Netlify permitir
```

---

## Histórico de releases

| Pacote | Commit | Data (UTC) | Método | Estado |
|--------|--------|------------|--------|--------|
| `bibi-poc-2026-06-22a` | `beeb894` | 22/06 ~00:01 | CLI `--prod` | ✅ Último no ar (antes do 503) |
| `bibi-poc-2026-06-21b` | `94c0f67` | 21/06 23:37 | CLI `--prod` | ✅ Substituído |
| `bibi-poc-2026-06-21a` | *(vários)* | 21/06 18:35+ | Git + CLI | ⚠️ Builds Git falharam |

### Deploys Git que falharam (não contam como release)

| Commit | PR | Motivo |
|--------|-----|--------|
| `94c0f67` | #27 | Build exit code 2 |
| `beeb894` | #28 | Build Git falhou (CLI funcionou) |
| `158b69f` | #39 | Provavelmente OK no CI — site já em 503 |

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
# Preferir --no-build após pre-release local (economiza build minutes na Netlify)
npx netlify deploy --prod --no-build --message "bibi-poc-YYYY-MM-DDx: <resumo>"
```

### 4. Fechar o pacote (atualizar este arquivo)

1. Copie a seção “Próximo pacote” para “Pacote em produção”.
2. Limpe “Próximo pacote” com o novo rascunho.
3. Adicione linha no “Histórico de releases”.
4. Commit: `docs(release): fecha pacote bibi-poc-YYYY-MM-DDx`

### 5. Tag opcional

```bash
git tag -a bibi-poc-2026-06-22b -m "Release bibi-poc-2026-06-22b"
git push origin bibi-poc-2026-06-22b
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
