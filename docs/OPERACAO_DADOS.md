# Operação de dados — Demo vs Operação

Como o Sistema Bibi gerencia **massa demo** e **dados reais** em cada ambiente.

Complementa [`DEPLOY_NETLIFY.md`](DEPLOY_NETLIFY.md) e [`VARIAVEIS_AMBIENTE.md`](VARIAVEIS_AMBIENTE.md).

---

## Dois modos

| | **Demo** (`APP_MODE=demo`) | **Operação** (`APP_MODE=operation`) |
|--|---------------------------|-------------------------------------|
| **Objetivo** | Apresentação, testes, treinamento | Uso diário da clínica |
| **Massa no build** | Sim (`RUN_SEED_ON_BUILD=true`) | Não |
| **Reset na UI** | Sim (`ALLOW_DEMO_RESET=true`) | Não |
| **Banco recomendado** | SQLite (Netlify POC) ou Postgres descartável | **Postgres** (Netlify Database) |
| **Dados após deploy** | Snapshot do seed | Vazios ou migrados — crescem com o uso |

**Produção atual** (`sistema-bibi.netlify.app`): modo **demo** — SQLite efêmero em Lambda.

---

## Variáveis de controle

| Variável | Demo (padrão) | Operação |
|----------|---------------|----------|
| `APP_MODE` | `demo` | `operation` |
| `RUN_SEED_ON_BUILD` | `true` | `false` |
| `ALLOW_DEMO_RESET` | `true` | `false` |
| `SEED_SCALE` | `small` \| `medium` \| `large` | — |
| `DATABASE_URL` | `file:./dev.db` | `postgresql://...` |

Lógica central: `src/lib/database-env.ts` · setup: `scripts/setup-database.ts`

---

## Comandos locais

```bash
# Massa demo completa (quando conveniente)
npm run db:bootstrap:demo

# Banco vazio para operar (schema sem seed)
npm run db:bootstrap:operation

# Só rodar setup conforme .env atual
npm run db:setup

# Massa manual sem rebuild
npm run db:seed
```

---

## Build Netlify

`scripts/netlify-build.mjs` chama `setup-database.ts`:

1. **SQLite** → `prisma db push` + seed (se `RUN_SEED_ON_BUILD`)
2. **Postgres** → `prisma migrate deploy` (ou `db push` se ainda sem migrations) + seed opcional

### Site demo (atual)

`netlify.toml` padrão — sem `APP_MODE` → demo com seed.

### Site operação (futuro)

No painel Netlify ou contexto de deploy:

```bash
APP_MODE=operation
RUN_SEED_ON_BUILD=false
ALLOW_DEMO_RESET=false
DATABASE_URL=postgresql://...
```

Exemplo em `netlify.toml` → `[context.operation.environment]`.

Deploy com contexto:

```bash
npx netlify deploy --prod --build --context operation
```

---

## Por que SQLite na Netlify não opera de verdade

Em Lambda, cada instância copia `dev.db` do build para `/tmp`. Escritas (walk-in, faturamento) **não são compartilhadas** entre portais nem entre cold starts.

| Sintoma | Causa |
|---------|--------|
| Walk-in some na agenda do prestador | Outra instância Lambda |
| Dados “voltam” ao demo | Cold start ou novo deploy |
| Dashboard muda sozinho | Instância diferente |

**Operação real exige Postgres** (ou outro banco compartilhado).

---

## Migrar para Postgres (operação)

### 1. Provisionar banco

[Netlify Database](https://docs.netlify.com/database/) ou Postgres gerenciado externo.

### 2. Alterar Prisma

Em `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 3. Criar migration inicial

```bash
DATABASE_URL="postgresql://..." npx prisma migrate dev --name init
```

### 4. Configurar ambiente operação

```bash
APP_MODE=operation
RUN_SEED_ON_BUILD=false
ALLOW_DEMO_RESET=false
DATABASE_URL=postgresql://...
```

### 5. Deploy

```bash
npm run pre-release   # com DATABASE_URL de staging se possível
npx netlify build
npx netlify deploy --prod --no-build --context operation
```

Dados nascem **vazios** — cadastros, walk-in e PPU passam a persistir.

### 6. Massa demo sob demanda

- **Nunca** no banco de operação
- Usar site demo separado, ou local: `npm run db:bootstrap:demo`
- Botão reset só em `APP_MODE=demo`

---

## Matriz de ambientes recomendada

| Ambiente | Site | APP_MODE | Banco | Seed |
|----------|------|----------|-------|------|
| Dev local | localhost:3000 | demo | SQLite `dev.db` | `db:seed` quando quiser |
| Demo pública | sistema-bibi.netlify.app | demo | SQLite build | build |
| Operação | novo site / subdomínio | operation | Postgres | nunca automático |
| CI / testes | — | demo | SQLite temp | sim |

---

## Restaurar demo em produção (modo demo)

`/interno/seguranca` → **Restaurar estado original do seed** (somente ADMIN).

Reexecuta `runDatabaseSeed()` na instância atual — útil para apresentações, não para sincronizar todas as Lambdas.

---

## Referências

- Runtime SQLite `/tmp`: `src/lib/db.ts`
- Reset demo: `src/lib/demo-reset.ts`
- Seed: `prisma/seed-data/run-seed.ts`
- Deploy: [`DEPLOY_NETLIFY.md`](DEPLOY_NETLIFY.md) § Limitações POC
