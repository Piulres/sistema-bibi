# Workflow Cursor — Desenvolver sem queimar deploy

Guia para usar o **Cursor** (local ou Cloud Agent) no dia a dia **sem** publicar
na Netlify a cada tarefa. Produção é atualizada só quando você fecha um
**pacote** manual — ver [`RELEASES.md`](RELEASES.md) e [`OPERACOES.md`](OPERACOES.md).

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
| Registrar | git | atualizar `docs/RELEASES.md` |

### Branches

| Branch | Papel |
|--------|-------|
| `cursor/*` | Feature / bugfix do agente ou dev local |
| `dev` | Integração — **base padrão de PRs** |
| `main` | Release estável — deploy e produção |

**Pacote validado na `main`:** **v2.0.0** ServiceOS (tag `v2.0.0`, commit `e823fe4`) — ver [`V2_0.md`](V2_0.md). **Produção** permanece **v1.2.0** até `netlify deploy --prod` manual (runbook em [`DEPLOY_NETLIFY.md`](DEPLOY_NETLIFY.md) § Publicar v2.0.0).

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
| Beneficiário (particular) | `/beneficiario/login` | `pedro.almeida@email.com` |

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
| **PRs abrem na `dev`** | Base branch padrão; nunca `main` para feature/bugfix |
| **Nunca** `netlify deploy --prod` | Salvo pedido explícito do usuário |
| **Nunca** “verificar produção” em loop | Um `curl` basta; 503 = cota, não bug |
| Preferir `npm run dev` + testes locais | Economiza tokens e cota |
| Usar `npm run pre-release` | Valida sem publicar |
| Atualizar `RELEASES.md` | Só após deploy manual confirmado pelo usuário |
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
- Último pacote válido: ver [`RELEASES.md`](RELEASES.md)

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
- Pacotes e histórico: [`RELEASES.md`](RELEASES.md)
- Deploy e troubleshooting: [`DEPLOY_NETLIFY.md`](DEPLOY_NETLIFY.md)
- Fluxos do sistema: [`FLUXOS.md`](FLUXOS.md)
