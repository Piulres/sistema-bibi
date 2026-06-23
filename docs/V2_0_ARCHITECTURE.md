# ServiceOS v2.0 — Arquitetura Multi-Nicho

> Documentação da evolução do Sistema Bibi de POC HealthTech para **ServiceOS** —
> infraestrutura horizontal Pay Per Use que suporta múltiplos nichos via parametrização.

---

## Visão geral

O ServiceOS reaproveita **~90% da lógica de faturamento e agendamento** existente.
A v2.0 altera principalmente a **camada de apresentação** (labels, cores, landing)
e a **parametrização por tenant**, sem duplicar motores de negócio.

```
┌─────────────────────────────────────────────────────────────┐
│  Camada de apresentação (labels, branding, landing)         │
│  niche + labels (JSON) por Tenant                           │
├─────────────────────────────────────────────────────────────┤
│  Motores compartilhados (inalterados na v2.0)               │
│  Agenda · ProcedureUsage · Price Snapshot · PIX · Webhooks  │
├─────────────────────────────────────────────────────────────┤
│  Prisma 6 + SQLite (multi-tenant)                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Nichos suportados

| `niche` | Setor | Exemplo de procedimento |
|---------|-------|-------------------------|
| `MEDICAL` | Saúde | Consulta Clínica Médica |
| `VET` | Veterinária | Banho e Tosa (R$ 150) |
| `DENTAL` | Odontologia | Consulta Odontológica (R$ 350) |
| `LEGAL` | Jurídico | Hora técnica jurídica (R$ 500) |
| `SPA` | Bem-estar | Aula de Yoga (R$ 120) |
| `EDUCATION` | Educação | Aula Particular |

Definição canônica: `src/lib/niche/types.ts` e `src/lib/niche/defaults.ts`.

---

## Camada de labels dinâmica

Cada `Tenant` possui:

- **`niche`** (`String`) — identificador do nicho operacional.
- **`labels`** (`String`, JSON) — dicionário de termos da UI que sobrescreve os defaults.

Exemplo para nicho `LEGAL`:

```json
{
  "patient": "Cliente",
  "procedure": "Serviço jurídico",
  "medicalRecord": "Dossiê"
}
```

### Resolução server-side

`src/lib/niche/resolve.ts` — `mergeNicheLabels()` combina defaults do nicho com overrides do tenant.

### Hook client-side

`src/hooks/useLabels.tsx` — `useLabels()` expõe `labels` e `t(key)` para tradução nos portais.

O `NicheProvider` é injetado em `PortalShell` e recebe `niche` + `labels` da sessão (`SessionUser`).

**Troca de nicho sem alteração no código do servidor:** basta atualizar `niche` e `labels` no banco (ou via seed/admin futuro). Os motores de `ProcedureUsage`, `PricingRule` e `Invoice` permanecem agnósticos.

---

## Procedure agnóstico

O modelo `Procedure` aceita qualquer tipo de serviço:

| Campo | Uso |
|-------|-----|
| `category` | `CONSULTA` \| `EXAME` \| `SERVICO` \| `SESSAO` \| `OCUPACIONAL` |
| `serviceType` | Classificação livre por nicho (ex.: `JURIDICO`, `ESTETICA`) |
| `basePrice` | Preço base para precificação dinâmica |
| `tissCode` | Código regulatório opcional (TUSS, OAB, etc.) |

O **price snapshot** em `ProcedureUsage.priceCharged` congela o valor no ato do registro — válido para qualquer nicho.

---

## White label por nicho

Paletas automáticas em `src/lib/niche/defaults.ts`:

| Nicho | Cor primária | Tom |
|-------|--------------|-----|
| MEDICAL | Azul `#2563eb` | Saúde |
| VET | Verde `#059669` | Veterinária |
| DENTAL | Ciano `#0891b2` | Odontologia |
| LEGAL | Slate `#475569` | Jurídico |
| SPA | Lavanda `#a78bfa` | Bem-estar |
| EDUCATION | Âmbar `#d97706` | Educação |

`applyNicheBrandingDefaults()` aplica a paleta quando o tenant usa cores padrão.

A landing (`src/app/page.tsx`) detecta o nicho via domínio customizado (`resolveLandingNiche`) ou query `?niche=VET` e renderiza seções temáticas via `getNicheLandingContent()`.

---

## Motor de cobrança

Invariantes preservados da v1.x:

1. **Precificação dinâmica** — `PricingRule.multiplier` por empresa.
2. **Congelamento de preço** — `chargePrice()` → `ProcedureUsage.priceCharged`.
3. **Strategy Pattern de pagamentos** — `PAYMENT_GATEWAY=mock` (PIX) funciona para qualquer setor.
4. **Categorias elegíveis a desconto B2B** — `CONSULTA`, `OCUPACIONAL`, `SERVICO`, `SESSAO`.

---

## Seed multi-nicho

`prisma/seed-data/niche-tenants.ts` cria 5 tenants demo (VET, DENTAL, LEGAL, SPA, EDUCATION) além do tenant médico principal.

Credenciais: senha `bibi123`, e-mails `operacao@{niche}.demo`.

---

## Rentabilização (Take Rate)

O ServiceOS trata qualquer transação de serviço processada — consulta médica, hora jurídica ou aula de yoga — como evento faturável com take rate sobre o volume transacionado, independentemente do nicho escolhido pelo cliente.

**ROI de referência (500 colaboradores):** modelo tradicional ~R$ 175k/mês vs ServiceOS ~R$ 14,5k/mês — **~91% de economia**. Ver `docs/pesquisa/09-sintese-consultor-senior.md`.

---

## Referências

- `src/lib/niche/` — tipos, defaults, labels, landing-content e resolução
- `src/hooks/useLabels.tsx` — hook de tradução (`useLabels` / alias `useNiche`)
- `src/constants/niches.ts` — dicionário mestre `NICHE_MASTER_LABELS`
- `prisma/schema.prisma` — `Tenant.niche`, `Tenant.labels`, `Procedure.serviceType`
- `docs/RELEASES.md` — pacotes fechados (v2.0 em desenvolvimento na `dev`)
- `docs/V2_0.md` — escopo e changelog v2.0
