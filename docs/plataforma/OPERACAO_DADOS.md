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

### Walk-in e persistência no modo demo (Netlify)

No modo **demo**, o SQLite é copiado para `/tmp` em cada instância Lambda. Escritas (paciente, agendamento, walk-in) **não são compartilhadas** entre cold starts nem entre requisições que caem em instâncias diferentes.

**Sintoma:** recepção cadastra walk-in em `/interno/agenda`, vê toast de sucesso, mas o paciente **some** ao recarregar ou em outra aba — parece que “walk-in não funciona”.

**Causa:** não é bug de API; é limitação da POC demo na Netlify.

**Mitigação na UI:** quando `DUAL_DATA_STORE=true` e o modo ativo é `demo`, a agenda exibe um `CalloutCard` de aviso (*“Modo demo — walk-in pode sumir”*) acima do formulário walk-in.

**Solução operacional:** ADMIN em `/interno/seguranca` → **Ir para operação** → confirmar `OPERAR` → novo login. No modo **operação**, escritas persistem em Netlify Blobs.

**API (detecção):** `GET /api/interno/appointments` retorna, além da agenda:

| Campo | Tipo | Quando |
|-------|------|--------|
| `dataStoreMode` | `"demo"` \| `"operation"` | `DUAL_DATA_STORE=true` |
| `walkInEphemeral` | `boolean` | `true` se dual-store ativo **e** modo demo |

Fonte: `src/app/api/interno/appointments/route.ts` · UI: `src/components/AppointmentsView.tsx`.

### Troca demo ↔ operação e sessão antiga

Ao alternar o modo em `POST /api/interno/data-store`, a sessão do usuário ainda referencia o `tenantId` do banco anterior. O novo banco (demo ou operação) pode não conter esse tenant.

A API resolve o tenant para a timeline de auditoria com fallback: tenta `user.tenantId` no DB ativo; se ausente, usa o primeiro tenant do banco novo. Isso evita falha silenciosa ao registrar `DATA_STORE_CHANGED` após a troca.

Recomendação mantida: **fazer login novamente** após alternar (`logoutRecommended: true` na resposta).

Fonte: `src/app/api/interno/data-store/route.ts`.

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
