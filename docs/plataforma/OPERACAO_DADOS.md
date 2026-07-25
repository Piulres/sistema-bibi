# Operação de dados — Demo vs Operação

Como o **Sistema Bibi - ServiceOS** gerencia **massa demo** e **dados reais** no mesmo site Netlify, **sem Postgres**.

Complementa [`DEPLOY_NETLIFY.md`](DEPLOY_NETLIFY.md) e [`VARIAVEIS_AMBIENTE.md`](VARIAVEIS_AMBIENTE.md).

---

## Modelo dual SQLite (produção Netlify)

Um único site (`sistema-bibi.netlify.app`) com **duas bases SQLite** embutidas no build:

| Base | Arquivo | Conteúdo |
|------|---------|------------|
| **Demo** | `prisma/demo.db` | Massa completa do seed (50 PJ, beneficiários, fluxos) |
| **Operação** | `prisma/operation.db` | Schema + bootstrap mínimo (tenant, usuários, catálogo) |

O modo ativo é escolhido em **`/interno/seguranca`** → card **Base de dados — demo ou operação** (somente ADMIN).

- Configuração persistida em **Netlify Blobs** (`bibi-config/data-store-mode`)
- Banco de **operação** persistido em **Netlify Blobs** (`bibi-databases/operation.db`)
- Escritas no modo operação são salvas automaticamente após mutações (debounce ~1,5s)

**Sem Postgres:** a operação real usa SQLite + Blobs como armazenamento compartilhado entre instâncias Lambda.

---

## Dois modos

| | **Demo** | **Operação** |
|--|----------|--------------|
| **Objetivo** | Apresentação, testes, treinamento | Uso diário da clínica |
| **Massa** | Seed completo no build | Bootstrap mínimo; dados crescem com uso |
| **Reset na UI** | Sim (`RESTAURAR` em segurança) | Não |
| **Persistência Netlify** | Snapshot do build (efêmero por instância) | Blobs (compartilhado) |

---

## Variáveis de controle

| Variável | Padrão Netlify | Descrição |
|----------|----------------|-----------|
| `DUAL_DATA_STORE` | `true` | Habilita seletor demo/operação |
| `DATA_STORE_MODE` | — | Modo inicial se Blobs vazio (`demo` \| `operation`) |
| `APP_MODE` | `demo` | Legado — mapeia para modo inicial |
| `RUN_SEED_ON_BUILD` | `true` | Gera `demo.db` com seed no build |
| `ALLOW_DEMO_RESET` | `false` (prod) / `true` (deploy-preview) | Botão restaurar demo (somente modo demo ativo) |
| `DATABASE_URL` | `file:./dev.db` | Legado local; build usa `demo.db` |

Lógica: `src/lib/data-store-mode.ts` · runtime: `src/lib/db.ts` · Blobs: `src/lib/sqlite-blob-persistence.ts`

---

## Comandos locais

```bash
# Massa demo completa → demo.db + operation.db + dev.db
npm run db:bootstrap:demo

# Só operation.db vazio (bootstrap mínimo)
npm run db:bootstrap:operation

# Setup conforme .env
npm run db:setup

# Validar integridade demo + operação
npm run db:verify
```

**Dev local:** dual-store habilitado por padrão. Modo salvo em `prisma/.data-store-mode`.

```bash
npm run dev
# /interno/seguranca → alternar demo ↔ operação
```

---

## Build Netlify

`scripts/netlify-build.mjs` → `setup-database.ts`:

1. `demo.db` — `db push` + seed
2. `operation.db` — `db push` + bootstrap mínimo
3. `dev.db` — cópia de `demo.db` (compatibilidade)

`DUAL_DATA_STORE=true` gravado no `.env` do build.

---

## Alternar em produção

1. Login como ADMIN (`faturamento@bibi.health` / `bibi123`)
2. `/interno/seguranca` → **Ir para operação**
3. Confirmar digitando `OPERAR`
4. Fazer login novamente

Para voltar à demo: confirmar com `DEMO`.

### Provisionar CEDIG na operação

O piloto **CEDIG Cruzeiro** (`slug=cedig`) faz parte do bootstrap de operação desde `v2.4.x`.
Fonte única: `ensureCedigTenant()` em `prisma/seed-data/cedig-catalog.ts` — usada pelo bootstrap
(`operation-bootstrap.ts`) e pelo endpoint de provisionamento (`src/lib/operation/provision-cedig.ts`).

#### O que entra no modo operação

| Incluído | Excluído (só no demo) |
|----------|------------------------|
| Tenant + branding teal CEDIG | Lançamentos/despesas de homologação (`seedHistory`) |
| Labels UI “Exame” (não “Consulta”) | Massa PJ/beneficiários do seed geral (`horizonte`) |
| Catálogo de 5 exames (`CEDIG-*`) | |
| Equipe (secretária, enfermagem, médicos, ADMIN) | |
| Empresas institucionais (CentralMed, Bem Saúde, Dr Saúde) | |
| Pacientes + logins PJ/Beneficiário mínimos (4 portais) | |

**Quando já vem pronto:** build Netlify (`operation.db` no artefato) ou `npm run db:bootstrap:operation` local.

**Quando chamar o endpoint:** base de operação em Blobs criada **antes** desse bootstrap (deploy antigo) ou
após editar `cedig-catalog.ts` e precisar sincronizar equipe/catálogo sem rebuild.

#### Endpoint (idempotente)

| Campo | Valor |
|-------|-------|
| **Rota** | `POST /api/interno/operation/provision-cedig` |
| **Auth** | Sessão interna **ADMIN** (`internoProfile=ADMIN`) |
| **Módulo RBAC** | `seguranca` (mesmo guard das rotas de `/interno/seguranca`) |
| **Body** | `{ "confirm": "CEDIG" }` — case-insensitive, espaços ignorados |
| **Persistência** | Se modo ativo = `operation`, grava `operation.db` em Blobs imediatamente |
| **Timeline** | Evento `DATA_STORE_CHANGED` no tenant do admin que chamou |

Respostas típicas:

```json
// 200 — tenant novo
{
  "message": "CEDIG Cruzeiro provisionado — equipe e catálogo prontos.",
  "tenantId": "…",
  "created": true,
  "procedures": 5,
  "mode": "operation"
}

// 200 — tenant já existia (re-sincroniza catálogo/equipe)
{
  "message": "CEDIG Cruzeiro já existia — catálogo e equipe atualizados.",
  "created": false,
  "procedures": 5,
  "mode": "operation"
}

// 400 — confirmação ausente ou incorreta
{ "error": "Digite \"CEDIG\" para confirmar" }

// 403 — não é ADMIN
{ "error": "Acesso negado" }
```

Exemplo com sessão (substitua o cookie após login como `faturamento@bibi.health`):

```bash
curl -sS -X POST http://localhost:3000/api/interno/operation/provision-cedig \
  -H 'Content-Type: application/json' \
  -H 'Cookie: bibi_session=SEU_TOKEN' \
  -d '{"confirm":"CEDIG"}'
```

Em produção: mesmo fluxo com `https://sistema-bibi.netlify.app`, após `/interno/seguranca` → **Ir para operação** (`OPERAR`).

#### Validar após provisionar

1. `/?tenant=cedig` — branding e cookie `bibi_segment`
2. Login `alana@cedig.demo` / `bibi123` → `/interno/gestao`
3. Credenciais completas: [`docs/clientes/cedig/README.md`](../clientes/cedig/README.md)

**Pitfall:** chamar o endpoint no modo **demo** também funciona (`seedHistory: true` inclui histórico de homologação).
Para piloto real, confirme o seletor em `/interno/seguranca` antes de provisionar.

---

## Limitações conhecidas

| Aspecto | Demo | Operação |
|---------|------|----------|
| Compartilhamento entre Lambdas | Não (cada instância copia do build) | Sim (via Blobs) |
| Concorrência alta | OK para apresentação | SQLite serializa escritas — adequado a clínica pequena/média POC |
| Postgres | Não necessário | Migração futura quando escalar |

---

## Migrar para Postgres (futuro)

Quando o volume exigir, provisionar Netlify Database e desabilitar dual-store:

```bash
DUAL_DATA_STORE=false
DATABASE_URL=postgresql://...
APP_MODE=operation
```

Ver seção Postgres em [`DEPLOY_NETLIFY.md`](DEPLOY_NETLIFY.md).

---

## Referências

- Modo ativo: `src/lib/data-store-mode.ts`
- Persistência SQLite: `src/lib/sqlite-blob-persistence.ts`
- Bootstrap operação: `prisma/seed-data/operation-bootstrap.ts`
- Provisionamento CEDIG: `src/lib/operation/provision-cedig.ts` · `src/app/api/interno/operation/provision-cedig/route.ts`
- Catálogo CEDIG: `prisma/seed-data/cedig-catalog.ts`
- UI seletor: `src/components/DataStoreCard.tsx`
- API: `GET|POST /api/interno/data-store`
- Reset demo: `src/lib/demo-reset.ts`
