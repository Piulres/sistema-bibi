# Seed — massa de demonstração

Arquitetura do seed modular (`prisma/seed-data/`), presets de escala,
tenants demo e restauração via UI. Fonte canônica para volume de dados e credenciais.

**Comandos:** `npm run db:seed` · `npm run db:push && npm run db:seed` · restaurar demo em `/interno/seguranca`

**Variáveis:** [`VARIAVEIS_AMBIENTE.md`](VARIAVEIS_AMBIENTE.md) §3 · **Fluxos:** [`FLUXOS.md`](FLUXOS.md) §2.3

---

## Visão geral

```
prisma/seed.ts                    # wrapper Prisma CLI → runDatabaseSeed()
prisma/seed-data/
├── run-seed.ts                   # orquestrador (wipe + Bibi + VitaCare)
├── companies.ts                  # 50 empresas PJ (fixas)
├── generators.ts                 # beneficiários e usuários PJ
├── scenarios.ts                  # massa operacional (agenda, faturas, webhooks…)
├── scale.ts                      # presets SEED_SCALE
├── vitacare.ts                   # segundo tenant white-label
├── catalog.ts                    # prestadores e procedimentos extras
├── monthly-baseline.ts           # baseline de receita mensal
├── totp-demo.ts                  # secret MFA demo
└── helpers.ts                    # datas, CPF/CNPJ determinísticos
```

O ponto de entrada compartilhado é `runDatabaseSeed()` em `run-seed.ts`. Usado por:

| Chamador | Quando |
|----------|--------|
| `prisma db seed` / `npm run db:seed` | Setup local, build Netlify |
| `executeDemoReset()` | Botão “Restaurar demo” (`src/lib/demo-reset.ts`) |

Ambos executam o **mesmo fluxo**: apaga todos os tenants e recria a massa do zero.

---

## Ordem de execução

1. **Wipe** — `deleteMany` em todas as tabelas (timeline → tenant).
2. **Tenant Bibi** — “Clínica Bibi Saúde” (teal), branding, usuários internos, prestadores.
3. **50 empresas PJ** — catálogo fixo em `companies.ts` (não escala com `SEED_SCALE`).
4. **Beneficiários e usuários PJ** — gerados por `generators.ts` (~199 beneficiários, ~27 usuários PJ).
5. **Massa operacional** — agendamentos, faturas, assinaturas, webhooks, mensagens (`scenarios.ts`).
6. **Baseline mensal** — receita recorrente (`monthly-baseline.ts`).
7. **Tenant VitaCare** — “Rede VitaCare” (azul), ilha multi-tenant separada (`vitacare.ts`).

---

## O que `SEED_SCALE` controla (e o que não controla)

| Controlado por `SEED_SCALE` | **Não** controlado (fixo) |
|-----------------------------|---------------------------|
| Agendamentos extras (`appointmentCount`) | Número de empresas PJ (**50**) |
| Mensagens (`messageCount`) | Fluxo demo TechCorp (`rh@techcorp.com`) |
| Span de cobranças recorrentes | Prestadores e procedimentos do catálogo |
| Usuários portal beneficiário | Usuários internos e credenciais MFA |
| Profundidade do histórico (`historyDays`) | Empresas com `pjEmail` fixo no catálogo |
| Volume VitaCare (empresas + beneficiários) | CNPJ/CPF determinísticos |

### Presets (`prisma/seed-data/scale.ts`)

| Preset | Agendamentos | Mensagens | Cobranças (meses) | Usuários beneficiário | Histórico (dias) | VitaCare empresas | VitaCare benef./empresa |
|--------|-------------|-----------|-------------------|----------------------|------------------|-------------------|-------------------------|
| `small` | 40 | 18 | 4 | 6 | 90 | 5 | 4 |
| `medium` *(padrão)* | 120 | 45 | 6 | 12 | 180 | 8 | 6 |
| `large` | 280 | 90 | 12 | 24 | 365 | 12 | 10 |

```env
SEED_SCALE=medium   # small | medium | large
```

Valor inválido → warning no console e fallback para `medium`.

---

## 50 empresas PJ (tenant Bibi)

Definidas em `companies.ts` com setor, status CRM e caso de uso comercial.
CNPJ e CPF são **determinísticos** (reprodutíveis entre execuções).

### Distribuição por status

| Status | Qtd | Uso em demo |
|--------|-----|-------------|
| `ATIVO` | 24 | Contratos vigentes com beneficiários |
| `INADIMPLENTE` | 3 | Cobrança em atraso, CRM |
| `NEGOCIACAO` | 7 | Pipeline comercial avançado |
| `PROPOSTA` | 7 | Propostas enviadas, sem beneficiários |
| `LEAD` | 8 | Prospecção inicial |
| `CANCELADO` | 1 | Churn / encerramento |

Cada registro inclui `useCase` (texto de vendas) e `sector` — útil para scripts de demo no CRM (`/interno/crm`).

**Empresa principal:** TechCorp (`rh@techcorp.com`) — desconto clínico 15%, 12 beneficiários, fluxo Pay Per Use documentado em [`FLUXOS.md`](FLUXOS.md) §7.

---

## Tenant VitaCare (white-label)

Segundo tenant, **isolado** do Bibi: empresas, pacientes, prestadores e branding próprios.
Branding azul (`#2563eb`) — ver [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md).

| Portal | E-mail | Senha |
|--------|--------|-------|
| Interno (operação) | `operacao@vitacare.demo` | `bibi123` |
| Empresa PJ | `rh@vitacarecorp.demo` | `bibi123` |
| Prestador | `dr.silva@vitacare.demo` | `bibi123` |

Volume de empresas e beneficiários VitaCare segue `SEED_SCALE` (tabela acima).
Dados do Bibi **não** aparecem no portal VitaCare e vice-versa (`tenantId` segregado).

---

## Credenciais demo (todos os tenants)

Senha única: **`bibi123`** (hash scrypt via `src/lib/password.ts`).

| Portal | E-mail | Notas |
|--------|--------|-------|
| Prestador | `dra.helena@bibi.health` | Tenant Bibi |
| Interno (admin) | `faturamento@bibi.health` | `internoProfile=ADMIN` |
| Interno (faturamento) | `financeiro@bibi.health` | RBAC `FATURAMENTO` |
| Interno (recepção) | `recepcao@bibi.health` | RBAC `RECEPCAO` |
| Interno (MFA) | `seguranca@bibi.health` | TOTP secret `JBSWY3DPEHPK3PXP` |
| Empresa PJ | `rh@techcorp.com` | TechCorp |
| Beneficiário | `joao.pereira@email.com` | + `maria.souza@email.com` |
| VitaCare interno | `operacao@vitacare.demo` | Tenant VitaCare |
| VitaCare PJ | `rh@vitacarecorp.demo` | Tenant VitaCare |
| VitaCare prestador | `dr.silva@vitacare.demo` | Tenant VitaCare |

---

## Restaurar modo demo (UI)

Alternativa ao `db:reset` destrutivo — disponível em `/interno/seguranca` para **ADMIN**.

| Item | Detalhe |
|------|---------|
| Flag | `ALLOW_DEMO_RESET` — ver [`VARIAVEIS_AMBIENTE.md`](VARIAVEIS_AMBIENTE.md) §3 |
| Confirmação | Digitar `RESTAURAR` na UI |
| API | `GET /api/interno/demo/reset` (status) · `POST` com `{ "confirm": "RESTAURAR" }` |
| Efeito | Wipe + `runDatabaseSeed()` — **todos os IDs mudam** |
| Pós-reset | UI faz logout automático → `/interno/login` |
| Concorrência | `409` se reset já em andamento |
| Produção | Desabilitado por padrão — exige `ALLOW_DEMO_RESET=true` no painel Netlify |

Fluxo detalhado: [`FLUXOS.md`](FLUXOS.md) §2.3 · Operações: [`OPERACOES.md`](OPERACOES.md) §4.4

---

## Comandos

| Situação | Comando |
|----------|---------|
| VM nova / banco vazio | `npm run db:push && npm run db:seed` |
| Repopular após testes | `npm run db:seed` |
| Schema alterado | `npm run db:push` (depois seed se necessário) |
| Recriar do zero (humano) | `npm run db:reset` — **bloqueado para agentes** |
| Demo em ambiente compartilhado | UI em `/interno/seguranca` (ADMIN) |

---

## Módulos auxiliares

| Arquivo | Função |
|---------|--------|
| `catalog.ts` | Prestadores demo + procedimentos extras além do catálogo base |
| `monthly-baseline.ts` | Faturas e assinaturas de meses anteriores para dashboard executivo |
| `totp-demo.ts` | Secret TOTP fixo para `seguranca@bibi.health` |
| `helpers.ts` | `daysAgo`, `todayAt`, validação de contrato por status CRM |

---

## Links

| Documento | Conteúdo |
|-----------|----------|
| [`VARIAVEIS_AMBIENTE.md`](VARIAVEIS_AMBIENTE.md) | `SEED_SCALE`, `ALLOW_DEMO_RESET` |
| [`FLUXOS.md`](FLUXOS.md) | Fluxos de negócio pós-seed |
| [`OPERACOES.md`](OPERACOES.md) | Setup e scripts npm |
| [`DEPLOY_NETLIFY.md`](DEPLOY_NETLIFY.md) | Seed no build de produção |
| [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) | Branding Bibi vs VitaCare |
