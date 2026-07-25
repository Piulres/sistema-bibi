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

### Composição do `operation.db` (bootstrap)

O bootstrap (`prisma/seed-data/operation-bootstrap.ts`) cria **dois tenants** `MEDICAL`:

| Tenant | Slug | Conteúdo | Excluído na operação |
|--------|------|----------|----------------------|
| Clínica Bibi Saúde | `bibi-saude` | 5 usuários internos/prestador, 14 procedimentos genéricos | — |
| CEDIG Cruzeiro | `cedig` | Equipe clínica + catálogo de exames (`cedig-catalog.ts`) | Pacientes, PJ, histórico de homologação |

Flags em `ensureCedigTenant()`:

| Flag | Demo (`demo.db`) | Operação (`operation.db`) |
|------|------------------|---------------------------|
| `portalMass` | `true` — pacientes + PJ CentralMed | `false` |
| `seedHistory` | `true` — lançamentos/agenda de homologação | `false` |

Dados reais (pacientes, empresas, lançamentos) entram pelo uso do sistema em produção — o bootstrap não pré-popula CRM B2B nem beneficiários.

### Validação `db:verify`

Script: `scripts/verify-databases.mjs` · integrado ao CI e `npm run pre-release`.

| Base | O que valida |
|------|--------------|
| `demo.db` | 7 tenants de segmento (`horizonte`…`eduprime`), usuários âncora, ≥50 PJ (ou ≥20 com `SEED_PROFILE=operation-1y`), ≥100 beneficiários |
| `operation.db` | Exatamente 2 tenants (`bibi-saude`, `cedig`), ambos `MEDICAL`, usuários essenciais (incl. `alana@cedig.demo`), ≥14 procedimentos, **0 empresas PJ e 0 pacientes** |
| `dev.db` | Espelha `demo.db` em tamanho (legado local) |

> O tenant `cedig` na demo tem massa completa (4 portais + histórico), mas `db:verify` só exige os 7 slugs de segmento em `demo.db`. A presença do CEDIG na operação é validada explicitamente em `operation.db`.

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
- UI seletor: `src/components/DataStoreCard.tsx`
- API: `GET|POST /api/interno/data-store`
- Reset demo: `src/lib/demo-reset.ts`
