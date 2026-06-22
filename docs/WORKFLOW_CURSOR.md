# Workflow Cursor — Desenvolver sem queimar deploy

Guia para usar o **Cursor** (local ou Cloud Agent) no dia a dia **sem** publicar
na Netlify a cada tarefa. Produção é atualizada só quando você fecha um
**pacote** manual — ver [`RELEASES.md`](RELEASES.md) e [`OPERACOES.md`](OPERACOES.md).

---

## Resumo em 30 segundos

```
Desenvolver → testar local → npm run pre-release → (você decide) → deploy manual
```

| Fase | Onde | Comando / ação |
|------|------|----------------|
| Codar | Cursor | branches `cursor/*` |
| Testar | localhost | `npm run dev` ou `npm run netlify:dev` |
| Validar pacote | máquina local | `npm run pre-release` |
| Publicar | **só você** | `npx netlify deploy --prod` |
| Registrar | git | atualizar `docs/RELEASES.md` |

---

## Setup inicial (uma vez por VM)

```bash
cp .env.example .env          # se não existir
npm install
npm run db:push && npm run db:seed
```

> Agentes: `npm run db:reset` é **bloqueado**. Use `db:push && db:seed`.

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

Evidências gravadas: [`evidencias/`](evidencias/).

---

## Validar pacote (sem publicar)

```bash
npm run pre-release
```

Executa, em sequência:

1. `npm run lint`
2. `npm run netlify:build` (mesmo pipeline do CI Netlify)

Se passar, o pacote está **pronto para publicação** — mas ainda **não** foi publicado.

### Pre-release vs CI completo

| Etapa | `pre-release` | CI (`.github/workflows/ci.yml`) |
|-------|:-------------:|:-------------------------------:|
| Lint | ✅ | ✅ |
| Vitest (`npm run test`) | ❌ | ✅ (53 testes) |
| `next build` | via `netlify:build` | ✅ |
| Playwright (`npm run test:e2e`) | ❌ | ✅ (5 specs) |

Antes de abrir PR, recomenda-se espelhar o CI:

```bash
npm run lint && npm run test && npm run build
# E2E (opcional local, obrigatório no CI):
npm run test:e2e
```

---

## Publicar em produção (manual, raro)

**Pré-requisitos:**

- Cota Netlify disponível (site não retorna `503 usage_exceeded`)
- `npm run pre-release` passou na `main`
- Você quer fechar um pacote agora

```bash
git checkout main && git pull
npm run pre-release
npx netlify deploy --prod --no-build --message "bibi-poc-YYYY-MM-DDx: resumo"
```

Depois: atualize [`RELEASES.md`](RELEASES.md) e faça commit na `main`.

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
| **Nunca** `netlify deploy --prod` | Salvo pedido explícito do usuário |
| **Nunca** “verificar produção” em loop | Um `curl` basta; 503 = cota, não bug |
| Preferir `npm run dev` + testes locais | Economiza tokens e cota |
| Usar `npm run pre-release` | Valida sem publicar |
| Atualizar `RELEASES.md` | Só após deploy manual confirmado pelo usuário |
| Não investigar 503 como regressão | Resposta `usage_exceeded` = plano Netlify |

---

## Produção fora do ar?

```bash
curl -s -o /dev/null -w "%{http_code}" https://sistema-bibi.netlify.app/
```

| Resposta | Significado |
|----------|-------------|
| `200` | Site online — ver pacote em [`RELEASES.md`](RELEASES.md) |
| `503` + `usage_exceeded` | Cota Netlify esgotada — **não é bug de código** |
| `502` / `500` | Ver [`DEPLOY_NETLIFY.md`](DEPLOY_NETLIFY.md) |

Desenvolvimento continua **100% local** independente do status de produção.

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
- Pacotes e histórico: [`RELEASES.md`](RELEASES.md)
- Testes automatizados: [`TESTES.md`](TESTES.md)
- Deploy e troubleshooting: [`DEPLOY_NETLIFY.md`](DEPLOY_NETLIFY.md)
- Fluxos do sistema: [`FLUXOS.md`](FLUXOS.md)
