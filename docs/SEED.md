# Massa de demonstração (seed)

Referência da **massa demo** populada por `npm run db:seed` (ou `db:reset`).
O seed é **determinístico**: mesmos CNPJs, preços e fluxos TechCorp a cada execução.

**Operações:** [`OPERACOES.md`](OPERACOES.md) · **Variáveis:** [`VARIAVEIS_AMBIENTE.md`](VARIAVEIS_AMBIENTE.md) (`SEED_SCALE`, `ALLOW_DEMO_RESET`)

---

## 1. Ponto de entrada

```
prisma/seed.ts  →  prisma/seed-data/run-seed.ts  →  módulos em prisma/seed-data/
```

| Comando | Quando usar |
|---------|-------------|
| `npm run db:push && npm run db:seed` | VM nova, schema alterado ou banco vazio (**caminho para agentes**) |
| `npm run db:seed` | Repopular após `db:push` |
| `npm run db:reset` | `--force-reset` + seed — **bloqueado para agentes** |

Restaurar demo em runtime (sem re-seed manual): `/interno/seguranca` → “Restaurar estado original do seed” (`ALLOW_DEMO_RESET=true`).

---

## 2. Mapa de arquivos

| Arquivo | Responsabilidade |
|---------|------------------|
| `run-seed.ts` | Orquestração: limpa DB, cria tenants, fluxo demo fixo, chama geradores |
| `pricing-market.ts` | **Catálogo e regras de mercado** — preços base, perfis por setor, benefícios corporativos |
| `companies.ts` | 50 empresas PJ (setor, status CRM, desconto, beneficiários) |
| `scenarios.ts` | Massa operacional: agenda, PPU, faturas, assinaturas, mensagens, webhooks |
| `monthly-baseline.ts` | Fechamento mensal corporativo (6 meses) com totais **derivados** do perfil |
| `generators.ts` | CPF/CNPJ determinísticos, beneficiários e usuários PJ em escala |
| `catalog.ts` | Prestadores extras, motivos de consulta, snippets de PEP |
| `scale.ts` | Presets `SEED_SCALE` (`small` \| `medium` \| `large`) |
| `vitacare.ts` | Tenant white-label VitaCare (segundo tenant) |
| `helpers.ts` | Datas relativas, contratos ativos por status |
| `totp-demo.ts` | Secret TOTP fixo para `seguranca@bibi.health` |

---

## 3. Precificação de mercado (`pricing-market.ts`)

Fonte canônica dos **preços e perfis clínicos do seed** (referência mercado privado/corporativo BR, clínica média 2024–2025).

### Catálogo de procedimentos

| Categoria | Exemplos | Preço base (R$) |
|-----------|----------|-----------------|
| `CONSULTA` | CON-CLM (Clínica Médica), CON-CAR, CON-PSI | 280–420 |
| `EXAME` | EXA-HEM, EXA-ECG, EXA-USG | 22–220 |
| `OCUPACIONAL` | OCC-ASO, OCC-PCM, OCC-AUD | 65–110 |

Consulta Clínica Médica (`CON-CLM`): **R$ 320,00** base.

### Desconto corporativo no seed

Empresas com `clinicalDiscount` em `companies.ts` geram `PricingRule.multiplier` no banco.
O seed aplica desconto apenas em categorias **CONSULTA** e **OCUPACIONAL** (`chargePrice()`).
Exames (`EXAME`) mantêm preço de tabela.

**Exemplo TechCorp** (índice 1, `clinicalDiscount: 0.85`):

- Consulta Clínica base R$ 320,00 → cobrada **R$ 272,00** (15% desconto)
- Eletrocardiograma R$ 95,00 → sem desconto

> Em runtime, `src/lib/pricing.ts` (`computePrice`) aplica `PricingRule` por `procedureId` + `companyId`. O seed espelha esse comportamento ao criar regras e `ProcedureUsage`.

### Perfis por setor

`sectorProfile(sector)` define, por setor econômico:

- `procedureCodes` — procedimentos típicos do contrato B2B
- `telemedicineRatio` — fração de agendamentos `TELE` na massa gerada
- `reasons` — motivos de consulta coerentes com o setor

Setores mapeados: Tecnologia, Financeiro, Varejo, Indústria, Logística, Construção Civil, Agronegócio, Educação, Saúde. Demais usam perfil padrão.

`scenarios.ts` usa `pickProcedureCode`, `pickAppointmentReason` e `isTelemedicineAppointment` para gerar massa coerente com o setor da empresa do beneficiário.

### Benefícios corporativos (add-on)

`CORPORATE_BENEFIT_PRODUCTS` — assinaturas de benefício (telemedicina 24h, bem-estar mental, check-up programado), **não** plano de saúde operadora. Valores e ciclos atribuídos por setor via `benefitProductForSector()`.

### Baseline de receita mensal

`monthly-baseline.ts` não usa totais fixos arbitrários. Para cada empresa **ATIVA** com beneficiários:

1. `estimateCompanyMonthlyPpu(company)` — estima faturamento PPU mensal (uso/beneficiário × preço médio do perfil)
2. Aplica crescimento linear de 3% por mês (6 meses)
3. Divide fatura em itens clínicos vs. medicina do trabalho (share maior em Indústria/Construção/Logística)

---

## 4. Empresas e CRM (`companies.ts`)

**50 empresas PJ** inspiradas em contratos típicos B2B (benefício corporativo, PCMSO, telemedicina):

| Status CRM | Qtd | Comportamento no seed |
|------------|-----|------------------------|
| `ATIVO` | 24 | Beneficiários, PPU, baseline mensal |
| `INADIMPLENTE` | 3 | Contrato ativo parcial; sem baseline recente |
| `NEGOCIACAO` | 7 | Pipeline CRM |
| `PROPOSTA` | 7 | Pipeline CRM |
| `LEAD` | 8 | Sem beneficiários |
| `CANCELADO` | 1 | Histórico apenas |

**Demo principal:** TechCorp Benefícios LTDA (índice 1, setor Tecnologia) — `rh@techcorp.com`, 12 beneficiários, desconto 15% em consultas/ocupacionais.

---

## 5. Fluxo demo fixo (sempre presente)

Independente de `SEED_SCALE`, o seed cria cenários estáveis para testes manuais e E2E:

| Personagem | Empresa | Destaques |
|------------|---------|-----------|
| João Pereira | TechCorp | Atendimento hoje, consulta + ECG pendentes de faturamento |
| Maria Souza | TechCorp | Teleconsulta agendada, hemograma pendente, assinatura trimestral |
| Pedro Almeida | Particular | Fatura PAGA histórica, assinatura suspensa |
| Dra. Helena | — | Prestador principal; agenda do dia |

Assinaturas demo usam produtos de `CORPORATE_BENEFIT_PRODUCTS` (ex.: telemedicina 24h TechCorp R$ 29,90/mês).

---

## 6. Escala (`SEED_SCALE`)

Controlada por `prisma/seed-data/scale.ts`:

| Preset | Agendamentos extras | Mensagens | Histórico (dias) | VitaCare (empresas) |
|--------|---------------------|-----------|------------------|---------------------|
| `small` | 40 | 18 | 90 | 5 |
| `medium` | 120 | 45 | 180 | 8 |
| `large` | 280 | 90 | 365 | 12 |

Volume fixo (não escala): 50 PJ, fluxo TechCorp, tenants Clínica Bibi + VitaCare.

---

## 7. Tenants

1. **Clínica Bibi Saúde** — tenant principal (teal), massa completa
2. **VitaCare** — white-label (azul), volume proporcional a `SEED_SCALE` (`vitacare.ts`)

---

## 8. Como alterar preços ou cenários

1. **Preços base e perfis de setor** → editar `pricing-market.ts` (`BASE_PROCEDURES`, `OCCUPATIONAL_PROCEDURES`, `SECTOR_PROFILES`)
2. **Desconto de uma empresa** → `clinicalDiscount` em `companies.ts` (0,85 = 15% off)
3. **Nova empresa no pipeline** → entrada em `SEED_COMPANIES` com `index` estável
4. **Volume da massa** → `SEED_SCALE` no `.env` ou presets em `scale.ts`
5. **Fluxo demo João/Maria/Pedro** → trecho fixo no final de `run-seed.ts` (evitar quebrar testes E2E)

Após mudanças no schema ou seed: `npm run db:push && npm run db:seed` e validar com `npm run dev`.

**Não** duplicar preços em `catalog.ts` — catálogo de procedimentos foi centralizado em `pricing-market.ts` (PR #50).

---

## 9. Relação com produção

- O seed roda no **build Netlify** (`npm run netlify:build`) — cada deploy recria dados demo (intencional na POC).
- Preços no seed **não** alteram `src/lib/pricing.ts`; ambos devem permanecer coerentes ao mudar regras de negócio.
- Credenciais demo: senha **`bibi123`** — ver [`README.md`](../README.md) §6.

---

## Ver também

- [`docs/FLUXOS.md`](FLUXOS.md) — Pay Per Use E2E e precificação dinâmica
- [`docs/PAYMENTS.md`](PAYMENTS.md) — cobrança PIX mock
- [`docs/NOTEBOOKLM.md`](NOTEBOOKLM.md) — resumo RAG da POC
- [`src/lib/pricing.ts`](../src/lib/pricing.ts) — `computePrice()` em runtime
