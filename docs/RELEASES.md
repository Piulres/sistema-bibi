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
| **Versão em produção** | **1.0.2** (`e30b2b0`) + mobile nav (`d5ef580`) |
| **Deploy Netlify** | Auto-deploy da `main` |
| `main` | `199b87e` — release / produção |
| `dev` | `2b7474b` — **1.1.0** — sincronizada com `main` + cadastros v1.1 |
| Tag git em produção | **`v1.0.2`** |
| Próximo pacote | **v1.1.0** — validar `dev` → merge `dev` → `main` |
| Validação `dev` | `npm run pre-release` |

### Sincronização de ambientes

| Ambiente | Branch | Conteúdo |
|----------|--------|----------|
| **Integração** | `dev` | Tudo em produção **+** v1.1.0 (cadastros) — **novas atividades aqui** |
| **Release / produção** | `main` | Pacote publicado (v1.0.2 + mobile nav) |
| **Netlify** | `main` | Espelha produção |

> **Regra:** PRs de feature/bugfix → base **`dev`**. Merge `dev` → `main` só ao fechar pacote.

---

## Pacote em produção (fechado)

### `v1.0.2` — identidade plataforma vs clínicas (white label)

| Campo | Valor |
|-------|-------|
| **Tag git** | `v1.0.2` |
| **Commit** | `e30b2b0` |
| **PR** | [#77](https://github.com/Piulres/sistema-bibi/pull/77) |
| **Publicado em** | 22/06/2026 ~15:08 — deploy Netlify (build Git, `main`) |
| **Escopo** | Separação Sistema Bibi (produto) × tenant clínico |
| **Docs** | [`V1_0.md`](V1_0.md) (linha 1.0.x) |

**Inclui:**

- Landing e marketing com **`PLATFORM_BRANDING`** fixo (**Sistema Bibi**), sem ler tenant do banco
- Logins com shell **Portal da clínica** + `Powered by Sistema Bibi`; branding do tenant após autenticação
- Tenant demo renomeado: **Clínica Horizonte** (não confundir com a marca da plataforma)
- `getLoginBrandingFromHeaders()` preparado para domínio customizado white-label

**Não inclui:** cadastros v1.1 (PR #72) — na `dev`, não produção.

---

### `v1.0.1` — agenda prestador + demo/operação *(substituído)*

| Campo | Valor |
|-------|-------|
| **Tag git** | `v1.0.1` |
| **Commit** | `e4d8a43` |
| **PR** | [#73](https://github.com/Piulres/sistema-bibi/pull/73) |
| **Publicado em** | 22/06/2026 ~13:49 — deploy Netlify (build Git) |
| **Escopo** | PRs #69–#71 (sem cadastros v1.1) |
| **Docs** | [`V1_0.md`](V1_0.md) |

**Inclui:** agenda prestador (dia/próximos/histórico), dual SQLite demo/operação, fluxo dev-first.

---

## Próximo pacote — produção (linha 1.1)

### `v1.1.0` — cadastros de mercado + CRUD confiável

| Campo | Valor |
|-------|-------|
| **Versão** | `1.1.0` na `dev` |
| **Base** | `main` @ `d5ef580` + cadastros (PR #72) |
| **PR** | [#72](https://github.com/Piulres/sistema-bibi/pull/72) — mergeado na `dev` |
| **Docs** | [`V1_1.md`](V1_1.md) |
| **Checklist** | `npm run pre-release` na `dev` → merge `dev`→`main` → deploy → tag `v1.1.0` → atualizar esta seção |

---

## Documentação por versão

| Versão | Doc | Estado |
|--------|-----|--------|
| **1.0.x** | [`V1_0.md`](V1_0.md) | ✅ `v1.0.2` em produção |
| **1.1.x** | [`V1_1.md`](V1_1.md) | Integrada na `dev` — não produção |

---

## Histórico de releases

| Versão / Pacote | Commit | Data (UTC) | Estado |
|-----------------|--------|------------|--------|
| **`v1.0.2`** | `e30b2b0` | 22/06/2026 | ✅ **Em produção** |
| `v1.0.1` | `e4d8a43` | 22/06/2026 | ✅ Substituído |
| `v1.0.0` | `685cc21` | 22/06/2026 | ✅ Substituído |
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

### 1. Preparar na `dev`, integrar na `main`

```bash
git checkout dev
git pull origin dev
npm run pre-release

git checkout main
git pull origin main
git merge dev
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
npx netlify deploy --prod --no-build --message "vX.Y.Z: descrição"
```

### 4. Fechar o pacote (atualizar este arquivo)

1. Copie a seção “Próximo pacote” para “Pacote em produção”.
2. Limpe “Próximo pacote” com o novo rascunho.
3. Adicione linha no “Histórico de releases”.
4. Commit: `docs(release): fecha pacote vX.Y.Z`

### 5. Tag (recomendado para versões estáveis)

```bash
git tag -a vX.Y.Z -m "Release X.Y.Z — descrição"
git push origin main
git push origin vX.Y.Z
```

### 6. Re-sincronizar `dev` após release

```bash
git checkout dev
git merge main
git push origin dev
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
| PR de feature direto na `main` | Integrar em `dev` primeiro |
| Confiar só no deploy Git | Histórico de falhas — validar com `pre-release` |
| `npm run db:reset` em agente | Bloqueado — use `db:push && db:seed` |

---

## Links

- Workflow Cursor (dev local): [`WORKFLOW_CURSOR.md`](WORKFLOW_CURSOR.md)
- Mapa de operações: [`OPERACOES.md`](OPERACOES.md)
- Deploy Netlify (troubleshooting): [`DEPLOY_NETLIFY.md`](DEPLOY_NETLIFY.md)
- Histórico 21/06: [`HISTORICO_2026-06-21.md`](HISTORICO_2026-06-21.md)
- Evidências visuais: [`evidencias/README.md`](evidencias/README.md)
