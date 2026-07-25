# Operação de dados — Demo vs Operação

Como o **Sistema Bibi - ServiceOS** gerencia **massa demo** e **dados reais** no mesmo site Netlify, **sem Postgres**.

Complementa [`DEPLOY_NETLIFY.md`](DEPLOY_NETLIFY.md) e [`VARIAVEIS_AMBIENTE.md`](VARIAVEIS_AMBIENTE.md).

---

## Modelo dual SQLite (produção Netlify)

Um único site (`sistema-bibi.netlify.app`) com **duas bases SQLite** embutidas no build:

| Base | Arquivo | Conteúdo |
|------|---------|------------|
| **Demo** | `prisma/demo.db` | Massa completa do seed (50 PJ, beneficiários, fluxos) |
| **Operação** | `prisma/operation.db` | Bootstrap mínimo: `bibi-saude` + `cedig` (equipe + catálogo; sem PJ/pacientes) |

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

O bootstrap de operação inclui o tenant **CEDIG Cruzeiro** (equipe + catálogo; sem pacientes/PJ nem histórico de homologação).
Se a base em Blobs for anterior a esse bootstrap, um ADMIN pode chamar:

```bash
POST /api/interno/operation/provision-cedig
{ "confirm": "CEDIG" }
```

Depois: `/?tenant=cedig` · `alana@cedig.demo` / `bibi123` · `/interno/gestao`.

**Demo vs operação** (`ensureCedigTenant` em `prisma/seed-data/cedig-catalog.ts`):

| Flag | Demo (`demo.db`) | Operação (`operation.db`) |
|------|------------------|---------------------------|
| `portalMass` | ✅ pacientes, PJ, beneficiários | ❌ greenfield |
| `seedHistory` | ✅ agenda, launches, despesas | ❌ histórico vazio |

Em produção com Blobs **anteriores** ao bootstrap v2.4.0, use `provision-cedig` para alinhar equipe e catálogo sem recriar a base.

### Validação (`db:verify`)

`scripts/verify-databases.mjs` valida o bootstrap de operação:

| Check | Esperado |
|-------|----------|
| Tenants | `bibi-saude` + `cedig` (2) |
| Nicho | `MEDICAL` em ambos |
| Usuários | 5 internos Bibi + `alana@cedig.demo` + `operacao@cedig.demo` |
| Procedimentos | ≥ 14 (catálogo Bibi + CEDIG) |
| Empresas PJ / pacientes | **0** (massa cresce pelo uso) |

```bash
npm run db:bootstrap:demo && npm run db:verify
```

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
- Provision CEDIG: `src/lib/operation/provision-cedig.ts` · `POST /api/interno/operation/provision-cedig`
- UI seletor: `src/components/DataStoreCard.tsx`
- API: `GET|POST /api/interno/data-store`
- Reset demo: `src/lib/demo-reset.ts`
