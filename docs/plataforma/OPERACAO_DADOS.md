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

## Evolução de schema (modo operação)

O banco de **operação** em Netlify Blobs **persiste entre deploys** e sempre vence o
artefato de build (`prisma/operation.db` gerado no `netlify-build`). O `prisma db push`
**não roda na Lambda** — sem intervenção, o schema do Blob ficava congelado na época do
primeiro persist.

### Sintoma (incidente v3.0.2)

Em produção (CEDIG, modo operação), `/interno/gestao` retornava **500**
(`no such column: bridgeStatus`) — a tabela `ClinicExamLaunch` no Blob não tinha as
colunas da ponte v2.6 (`bridgeStatus`, `bridgeNote`, `appointmentId`, `usageId`,
`invoiceId`).

### Correção automática (v3.0.2+)

No boot da Lambda, `ensureLambdaOperationDb` (`src/lib/sqlite-blob-persistence.ts`)
chama `syncSqliteSchema` (`src/lib/operation/schema-sync.ts`), comparando o banco
ativo (`/tmp/bibi-operation.db`) com o artefato de build e aplicando migrações
**aditivas** idempotentes:

| Operação | Quando |
|----------|--------|
| `CREATE TABLE IF NOT EXISTS` | Tabela ausente no Blob |
| `ALTER TABLE … ADD COLUMN` | Coluna ausente (nullable ou com `DEFAULT`) |
| `CREATE INDEX IF NOT EXISTS` | Índice ausente |

**Memoização:** o sync roda uma vez por versão do Blob na instância Lambda
(`schemaSyncedVersion`), evitando reprocesso a cada request.

**Logs:** alterações aparecem como `[operation-schema-sync]` no log da função
(JSON com `createdTables`, `addedColumns`, `createdIndexes`, `skipped`). Falha no
sync **não bloqueia o boot** — o comportamento volta ao anterior (erro registrado).

### Limitações

| Tipo de mudança | Comportamento |
|-----------------|---------------|
| Aditiva (tabela/coluna/índice novo) | Aplicada automaticamente no boot |
| Destrutiva (DROP, RENAME, `NOT NULL` sem default) | **Não** aplicada — entra em `skipped`; exige migração assistida |
| Índice UNIQUE com dados legados incompatíveis | Ignorado (não bloqueia boot) |

**Dev local:** o schema-sync **só roda em runtime Lambda** (`isLambdaSqliteRuntime()`).
Após mudar `schema.prisma`, use `npm run db:push` ou `npm run db:bootstrap:operation`.

**Testes:** `tests/unit/operation-schema-sync.test.ts` — colunas/tabelas/índices,
idempotência, `extractColumnDefinition`.

---

## Alternar em produção

1. Login como ADMIN (`faturamento@bibi.health` / `bibi123`)
2. `/interno/seguranca` → **Ir para operação**
3. Confirmar digitando `OPERAR`
4. Fazer login novamente

Para voltar à demo: confirmar com `DEMO`.

**Proteção:** com o site em **operação**, acessar `/segmentos/*`, `?tenant=petcare` ou e-mails demo **não** rebaixa automaticamente para demo (isso apagava walk-ins na Netlify). Só o ADMIN em Segurança volta à demo.

**Persistência:** escritas no modo operação fazem flush imediato no Blob (não só debounce 1,5s). Cada `getPrisma()` rehidrata `/tmp` se o Blob estiver mais novo — evita prestador/walk-in “criado e sumiu” entre Lambdas.

### Provisionar CEDIG na operação

O bootstrap de operação inclui o tenant **CEDIG Cruzeiro** (equipe + catálogo; sem `portalMass` por padrão — pacientes/PJ entram via enrich local ou uso real).
Para massa dos 4 portais em local: `./scripts/cedig-mapear.sh` · playbook [`../clientes/cedig/OPERACAO.md`](../clientes/cedig/OPERACAO.md).
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
- Schema-sync operação: `src/lib/operation/schema-sync.ts`
- Bootstrap operação: `prisma/seed-data/operation-bootstrap.ts`
- UI seletor: `src/components/DataStoreCard.tsx`
- API: `GET|POST /api/interno/data-store`
- Reset demo: `src/lib/demo-reset.ts`
