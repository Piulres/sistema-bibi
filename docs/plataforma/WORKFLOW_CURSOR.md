# Workflow Cursor — Desenvolver sem queimar deploy

Guia para usar o **Cursor** (local ou Cloud Agent) no dia a dia **sem** publicar
na Netlify a cada tarefa. Produção é atualizada só quando você fecha um
**pacote** manual — ver [`RELEASES.md`](../versoes/RELEASES.md) e [`OPERACOES.md`](OPERACOES.md).

---

## Resumo em 30 segundos

```
Desenvolver → testar local → PR → dev → (fechar pacote) → main → deploy manual
```

| Fase | Onde | Comando / ação |
|------|------|----------------|
| Codar | Cursor | branches `cursor/*` |
| Testar | localhost | `npm run dev` ou `npm run netlify:dev` |
| Validar pacote | máquina local | `npm run pre-release` |
| Integrar | GitHub | **PR (draft) → `dev`** — nunca direto na `main` |
| Release | GitHub | merge `dev` → `main` (humano, ao fechar pacote) |
| Publicar | **só você** | `npx netlify deploy --prod` |
| Registrar | git | atualizar `RELEASES.md` + changelog da landing (`LANDING_CHANGELOG.md`) |

### Branches

| Branch | Papel |
|--------|-------|
| `cursor/*` | Feature / bugfix do agente ou dev local |
| `dev` | Integração — **base padrão de PRs** |
| `main` | Release estável — deploy e produção |

**Produção (27/07/2026):** **v3.0.19** em Netlify (`bibi-poc-2026-07-27j` @ `1fca530`, deploy `6a66f3a7`) · **`main`/`dev` v3.0.20** preparado (pendente deploy) · ver [`../versoes/RELEASES.md`](../versoes/RELEASES.md). Escopo: [`../versoes/V3_0.md`](../versoes/V3_0.md) · CEDIG/pontes: [`../versoes/V2_6.md`](../versoes/V2_6.md) · login: [`../versoes/V2_5.md`](../versoes/V2_5.md).

---

## Setup inicial (uma vez por VM)

```bash
cp .env.example .env          # opcional — setup cria .env se ausente
npm install
npm run setup                 # dev simples (dev.db) — idempotente
# Dual-store (demo.db + operation.db) — recomendado:
# npm run db:bootstrap:demo
# CEDIG local (?tenant=cedig → operation): ./scripts/cedig-mapear.sh
```

> Agentes: `npm run db:reset` é **bloqueado**. Use `npm run setup` ou `db:bootstrap:demo`.  
> Dual-store / CEDIG: [`OPERACAO_DADOS.md`](OPERACAO_DADOS.md) · [`../clientes/cedig/OPERACAO.md`](../clientes/cedig/OPERACAO.md).

---

## Desenvolvimento diário

### Servidor local

```bash
npm run dev
# http://localhost:3000
```

### Emular Netlify (Blobs, headers, proxy)

```bash
npm run netlify:dev
# http://localhost:8888
```

### Credenciais demo

Senha única: **`bibi123`**. Portais e e-mails em [`README.md`](../README.md) e `AGENTS.md`.

### Fluxos para validar antes de fechar pacote

| Portal | URL local | Login |
|--------|-----------|-------|
| Landing | `/` | — |
| Prestador | `/login` | `dra.helena@bibi.health` |
| Interno | `/interno/login` | `faturamento@bibi.health` |
| PJ | `/pj/login` | `rh@techcorp.com` |
| Beneficiário | `/beneficiario/login` | `joao.pereira@email.com` |
| Beneficiário (particular) | `/beneficiario/login` | `pedro.almeida@email.com` |

Evidências gravadas: [`../evidencias/`](../evidencias/).

---

## Validar pacote (sem publicar)

```bash
npm run pre-release
```

Executa, em sequência (`scripts/pre-release.mjs`):

1. `npm run lint`
2. `npm run docs:verify`
3. `npm run openapi:verify`
4. `npm run db:bootstrap:demo` (`SEED_SCALE=small`)
5. `npm run db:verify`
6. `npm test` (598 Vitest · 83 arquivos)
7. `npm run netlify:build` (mesmo pipeline do CI Netlify)
8. `npm run smoke:netlify-pwa` (smoke PWA/estáticos no artefato)

Se passar, o pacote está **pronto para publicação** — mas ainda **não** foi publicado.

### Validar configuração Cursor (v3.0.4+)

```bash
npm run cursor:verify
```

Verifica drift da configuração de agentes:

| Check | O que valida |
|-------|--------------|
| Router único | Só `router.mdc` com `alwaysApply: true` |
| Rules esperadas | Arquivos listados em `OPERACOES.md` §7 existem |
| Skill references | `crud-entity`, `cedig-clinic`, `billing-pix`, `auth-tenant`, `release-package`, `CHECKLIST` |
| `AGENTS.md` enxuto | Índice com menos de 120 linhas |
| Sem artefatos obsoletos | `serviceos-agent-skill.mdc` removido; sem sufixo `-5f67` |

Script: `scripts/verify-cursor-config.mjs`. Incluir após mudanças em `.cursor/rules/`, `.cursor/skills/` ou `AGENTS.md`.

---

## Publicar em produção (manual, raro)

**Pré-requisitos:**

- Cota Netlify disponível (site não retorna `503 usage_exceeded`)
- `npm run pre-release` passou na `main`
- Você quer fechar um pacote agora

```bash
git checkout main && git pull
npm run pre-release
npx netlify deploy --prod --message "bibi-poc-YYYY-MM-DDx: resumo"
```

Depois: atualize [`RELEASES.md`](../versoes/RELEASES.md) e faça commit na `main`.

---

## Desligar deploy automático na Netlify

Para evitar que cada merge na `main` dispare build (cota + tokens):

1. [Netlify Dashboard](https://app.netlify.com/projects/sistema-bibi) → **Site configuration**
2. **Build & deploy** → **Continuous deployment**
3. **Stop builds** (ou desative **Auto publishing** em Deploys)

Assim só publica quando você roda `netlify deploy --prod` ou clica “Trigger deploy” no painel.

---

## Regras para agentes Cursor / Cloud

| Regra | Detalhe |
|-------|---------|
| **PRs abrem na `dev`** | Base branch padrão; nunca `main` para feature/bugfix |
| **Nunca** `netlify deploy --prod` | Salvo pedido explícito do usuário |
| **Nunca** “verificar produção” em loop | Um `curl` basta; 503 = cota, não bug |
| Preferir `npm run dev` + testes locais | Economiza tokens e cota |
| Usar `npm run pre-release` | Valida sem publicar |
| Atualizar `RELEASES.md` | Só após deploy manual confirmado pelo usuário |
| Atualizar changelog da landing | `changelog-content.ts` + `platform.ts` — ver [`LANDING_CHANGELOG.md`](LANDING_CHANGELOG.md) |
| Não investigar 503 como regressão | Resposta `usage_exceeded` = plano Netlify |

---

## Produção fora do ar?

```bash
curl -s https://sistema-bibi.netlify.app/
```

Se retornar `{"error":"usage_exceeded",...}`:

- **Não é bug de código** — cota do plano Netlify esgotada
- Desenvolvimento continua **100% local**
- Aguarde reset mensal ou upgrade do plano
- Último pacote válido: ver [`RELEASES.md`](../versoes/RELEASES.md)

---

## Quando usar Cloud Agent vs local

| Tarefa | Onde |
|--------|------|
| Feature, bugfix, seed, docs | Cursor (local ou Cloud) |
| `npm run pre-release` | Qualquer ambiente com Node 22 |
| `netlify deploy --prod` | **Sua máquina** com CLI logada (recomendado) |
| Configurar env vars / cota | Painel Netlify (humano) |

---

## Links

- Mapa de operações: [`OPERACOES.md`](OPERACOES.md)
- Demo vs operação: [`OPERACAO_DADOS.md`](OPERACAO_DADOS.md)
- Pacotes e histórico: [`RELEASES.md`](../versoes/RELEASES.md)
- Deploy e troubleshooting: [`DEPLOY_NETLIFY.md`](DEPLOY_NETLIFY.md)
- Fluxos do sistema: [`FLUXOS.md`](../produto/FLUXOS.md)
