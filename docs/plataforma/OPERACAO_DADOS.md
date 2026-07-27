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
- Escritas no modo operação são salvas no Blob após cada mutação (flush imediato; em `$transaction`, só após o COMMIT)

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

**Proteção:** com o site em **operação**, acessar `/segmentos/*`, `?tenant=petcare` ou e-mails demo **não** rebaixa automaticamente para demo (isso apagava walk-ins na Netlify). Só o ADMIN em Segurança volta à demo.

**Persistência:** escritas no modo operação fazem flush imediato no Blob (não só debounce 1,5s). Cada `getPrisma()` rehidrata `/tmp` se o Blob estiver mais novo — evita prestador/walk-in “criado e sumiu” entre Lambdas.

Em mutações dentro de `$transaction` Prisma (ex.: **Marcar paga**), o flush só ocorre **após o COMMIT** — ver §Flush em transação abaixo.

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

## Flush em `$transaction` (v3.0.11+)

No modo **operação**, o Prisma client é estendido em `src/lib/db.ts` para persistir
o `operation.db` no Netlify Blobs após cada write (`withOperationBlobFlush`).

### Problema corrigido (v3.0.11)

Antes do hotfix, a query extension chamava `flushOperationDatabasePersist()` **no meio**
de `$transaction`. O SQLite ainda não tinha feito COMMIT — o Blob recebia o estado
**anterior** à mutação.

| Sintoma | Causa | Onde aparece |
|---------|-------|--------------|
| **Marcar paga** mostra `PAGA` na UI e volta a `FECHADA` após cold start ou outra Lambda | Blob gravado antes do COMMIT | Produção Netlify (modo operação) |
| Mesmo padrão em PIX confirmado, bridge assinatura → fatura, etc. | Qualquer `$transaction` com múltiplos writes | `invoice-service.ts` e outros serviços |

Na instância **quente** o `/tmp/operation.db` local tinha o COMMIT — parecia OK até a
próxima reidratação do Blob.

### Como funciona agora

1. `src/lib/sqlite-transaction-flush.ts` — `AsyncLocalStorage` rastreia profundidade de transação.
2. `$transaction` é envolvido por `runWithSqliteTransactionTracking(..., onSettle)`.
3. Writes **dentro** da tx: `shouldFlushSqliteWriteAfterOperation` retorna `false`.
4. No `finally` do outermost tx: `onSettle` → `flushOperationDatabasePersist()` (COMMIT já ocorreu).

```text
markInvoicePaid()
  └─ prisma.$transaction(tx => { update Invoice; create Payment })
       ├─ writes internos → flush suprimido
       └─ COMMIT → onSettle → persist operation.db → Blob
```

### Código e testes

| Artefato | Caminho |
|----------|---------|
| Tracking de transação | `src/lib/sqlite-transaction-flush.ts` |
| Extensão Prisma + flush | `src/lib/db.ts` (`withOperationBlobFlush`) |
| Marcar paga (exemplo) | `src/lib/invoice-service.ts` → `markInvoicePaid` |
| Unitário | `tests/unit/sqlite-transaction-flush.test.ts` |
| API jornada | `tests/api/consultorio-journey.test.ts` (variante marcar paga) |
| E2E UI | `e2e/jornada-consultorio.spec.ts` (modal Confirmar pagamento) |

**Regra para novos serviços:** mutações multi-tabela devem usar `prisma.$transaction`.
O flush pós-COMMIT é automático — **não** chamar `flushOperationDatabasePersist()` manualmente
no meio da transação.

Pacote: [`../versoes/V3_0.md`](../versoes/V3_0.md) §v3.0.11 · faturamento: [`PAYMENTS.md`](PAYMENTS.md).

---

## Schema-sync do `operation.db` (v3.0.2+)

O banco de **operação** em Netlify Blobs **congela o schema** da época do primeiro
`persist`. O `prisma db push` roda só no build — não na Lambda — então tabelas e
colunas novas (ex.: ponte v2.6 em `ClinicExamLaunch`) não chegavam ao Blob e
`/interno/gestao` retornava **500** (`no such column: bridgeStatus`).

### Como funciona

1. **Boot Lambda** (`ensureLambdaOperationDb` em `src/lib/sqlite-blob-persistence.ts`):
   reidrata `/tmp/operation.db` do Blob e compara com o artefato de build
   (`prisma/operation.db` embutido no deploy).
2. **Migração aditiva** (`src/lib/operation/schema-sync.ts`):
   `CREATE TABLE` / `ALTER TABLE … ADD COLUMN` / `CREATE INDEX IF NOT EXISTS`
   idempotentes. Drops, renames e `NOT NULL` sem default ficam fora — exigem
   migração assistida (log `[operation-schema-sync]`).
3. **Flush no Blob (v3.0.3):** se houve alteração de schema, persiste imediatamente
   no Blob. Sem isso, cada cold start re-migrava e o schema antigo voltava.

Escritas de negócio continuam com `flushOperationDatabasePersist()` após mutações
(`src/lib/db.ts`) — ver §Persistência acima.

### Sintomas e diagnóstico

| Sintoma | Causa provável | Ação |
|---------|----------------|------|
| `/interno/gestao` 500 ao listar/salvar | Blob sem colunas/tabelas do schema atual | Deploy com pacote ≥ v3.0.2; conferir logs `[operation-schema-sync]` |
| Schema migra a cada cold start | Blob não recebeu flush pós-sync | Deploy ≥ v3.0.3 |
| Gestão OK local, 500 só em produção | Local usa `operation.db` do build; produção usa Blob antigo | Normal até o primeiro boot pós-deploy com schema-sync |

### Testes e referências

- Unitário: `tests/unit/operation-schema-sync.test.ts`
- Incidente e correção: [`../versoes/V3_0.md`](../versoes/V3_0.md) (§v3.0.2 / §v3.0.3)
- Timeline CEDIG: [`../clientes/cedig/STATUS.md`](../clientes/cedig/STATUS.md)

---

## Limpeza pontual (operation.db em Blobs)

Quando houver sujeira de testes no banco de **operação** (duplicata clínica, usuários `golive.*` / `*.persist.*`, smoke R$1):

1. Baixar: `npx netlify blobs:get bibi-databases operation.db --output /tmp/operation.db`
2. Rodar (sobre cópia): `node scripts/cleanup-operation-test-data.mjs /tmp/operation.db`
3. Republicar com metadata: `node scripts/publish-operation-blob.mjs /tmp/operation.db` (grava `updatedAt` para as Lambdas reidratarem)
4. Registrar na timeline do cliente (ex.: [`docs/clientes/cedig/STATUS.md`](../clientes/cedig/STATUS.md))

O script de 2026-07-26 unificou as anamneses da consulta **Renan Emigdio** / **Dra. Gabriela Lage** e removeu a massa efêmera de golive/smoke — mantendo a consulta, a ficha unificada e a prescrição Dexilant.

### Reset de fluxos CEDIG (voltar ao zero operacional)

Para zerar **atendimentos e fluxos** do tenant `cedig` sem apagar equipe/catálogo/preços:

1. Baixar + backup (como acima)
2. `node scripts/reset-cedig-transactional.mjs /tmp/operation.db --confirm=LIMPAR-FLUXOS`
3. `DATABASE_URL="file:/tmp/operation.db" npx tsx scripts/cedig-ensure-commercial.ts` (empresas + PricingRules)
4. `node scripts/publish-operation-blob.mjs /tmp/operation.db`
5. Timeline: [`../clientes/cedig/STATUS.md`](../clientes/cedig/STATUS.md) · playbook: [`../clientes/cedig/OPERACAO.md`](../clientes/cedig/OPERACAO.md)

**Não** usar `db:reset` nem o botão “Restaurar demo” (só vale no modo demo).

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
- Flush pós-COMMIT em transação: `src/lib/sqlite-transaction-flush.ts`
- Schema-sync operação: `src/lib/operation/schema-sync.ts`
- Bootstrap operação: `prisma/seed-data/operation-bootstrap.ts`
- UI seletor: `src/components/DataStoreCard.tsx`
- API: `GET|POST /api/interno/data-store`
- Reset demo: `src/lib/demo-reset.ts`
