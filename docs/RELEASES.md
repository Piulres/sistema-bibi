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
| **Versão semântica** | **1.0.0** |
| Site produção | https://sistema-bibi.netlify.app |
| Pacote em produção | `v1.0.0` → commit `de88c0e` · deploy `6a393af3` |
| `main` | `de88c0e` — alinhada com produção (release) |
| `dev` | branch de **integração** — PRs de feature mergeiam aqui primeiro |
| Tag git | `v1.0.0` |
| Validação local | `npm run pre-release` ✅ · 88 unit · 43 E2E |
| Deploy | 22/06/2026 — `netlify build` + `--no-build` |

---

## Pacote em produção (fechado)

### `v1.0.0` — primeira versão estável

| Campo | Valor |
|-------|-------|
| **Tag git** | `v1.0.0` |
| **Commit** | `de88c0e` — merge `dev` (PRs #64–#66) + fix teste PPU |
| **Versão npm** | `1.0.0` (`package.json`) |
| **Publicado em** | 22/06/2026 — deploy `6a393af3` (netlify build + `--no-build`) |
| **Método** | `npm run pre-release` + `npx netlify deploy --prod --no-build` |
| **Site** | `sistema-bibi` |

**Marco:** POC consolidada em versão **1.0** — quatro portais, Pay Per Use completo, walk-in particular, mapas CRUD/fluxo e melhorias visuais.

**Inclui (desde `bibi-poc-2026-06-22c`):**

- Navegação SPA fluida (layouts persistentes, breadcrumbs, mobile drawer)
- Walk-in particular na recepção + confirmação de chegada
- Mapa CRUD (27 entidades) e mapa de melhorias de fluxo
- Edição inline em Cadastros (paciente, empresa, procedimento, usuário)
- Melhorias visuais: `StatCard`, `FlowStepper`, `AppointmentCard`, `TabBar`
- Jornada PPU: stepper Beneficiário/Prestador, cancelamento de consulta, PIX QR mock
- Prestador: botão “Paciente presente” (`CONFIRMADO`)
- Docs: `JORNADA_CLIENTE.md`, `AUDITORIA_FLUXOS.md`, `FLUXOS.md` §8.5–8.7
- CI Node 24 · 88 testes unitários · 44 E2E

**Validação pré-deploy:**

- `npm run lint` — OK
- `npm run test` — 88/88
- `npm run test:e2e` — 44 (1 skip condicional)
- `npm run pre-release` — OK

---

## Próximo pacote (pendente)

*(Nenhum — aguardando próximo ciclo de desenvolvimento após 1.0.0)*

| Campo | Valor |
|-------|-------|
| **Versão alvo** | `1.1.0` ou `1.0.1` (a definir) |
| **Checklist** | `npm run pre-release` → cota OK → `deploy --prod --no-build` → tag |

---

## Histórico de releases

| Versão / Pacote | Commit | Data (UTC) | Método | Estado |
|-----------------|--------|------------|--------|--------|
| **`v1.0.0`** | `2395921` | 22/06/2026 | CLI `--prod --no-build` + tag | ✅ **Em produção** |
| `bibi-poc-2026-06-22c` | `32dad64` | 22/06 ~03:50 | CLI `--prod --no-build` | ✅ Substituído por 1.0.0 |
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
npx netlify build    # build local com plugins Next.js (incluído no pre-release)
npx netlify deploy --prod --no-build --message "v1.0.0: primeira versão estável"
```

### 4. Fechar o pacote (atualizar este arquivo)

1. Copie a seção “Próximo pacote” para “Pacote em produção”.
2. Limpe “Próximo pacote” com o novo rascunho.
3. Adicione linha no “Histórico de releases”.
4. Commit: `docs(release): fecha pacote vX.Y.Z`

### 5. Tag (recomendado para versões estáveis)

```bash
git tag -a v1.0.0 -m "Release 1.0.0 — primeira versão estável"
git push origin main
git push origin v1.0.0
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
