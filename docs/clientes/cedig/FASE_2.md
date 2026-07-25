# CEDIG — Fase 2: mapa de gaps e pontes operacionais

Documento de trabalho do fluxo ponta a ponta após a gestão clínica (fase A–C).

**Produto:** Sistema Bibi - ServiceOS · tenant `cedig` · labels **Exame** (`useLabels()`).

---

## Visão desejada

```text
Alana agenda/cadastra
  → exame acontece / é lançado na gestão
  → cobrança/pagamento contabilizado (PPU)
  → médico vê no Prestador
  → paciente/beneficiário vê o pertinente
  → PJ/convênio vê consumo
  → dono vê indicadores + financeiro coerentes
```

---

## Mapa (estado após v2.6)

| Etapa | Antes (v2.4) | Depois (fase 2 / v2.6) | Prioridade |
|-------|--------------|------------------------|------------|
| Alana agenda (walk-in) | ✅ Appointment | ✅ + botão **Lançar na gestão** | P0 ✅ |
| Alana lança em `/interno/gestao` | ✅ ledger isolado | ✅ + ponte PPU | P0 ✅ |
| Pagamento | só campo no lançamento | ✅ Invoice + Payment (exceto CONVENIO → FECHADA) | P0 ✅ |
| Médico (Prestador) | pacientes se `patientId`; extrato vazio | ✅ Appointment REALIZADO + ProcedureUsage | P0 ✅ |
| PJ / convênio | consumo só via usages manuais | ✅ Invoice com `companyId` (CentralMed…) | P0 ✅ |
| Export Excel mensal | ❌ | ✅ `/api/interno/clinic-finance/export` | P1 ✅ |
| READONLY mutando gestão | gap | ✅ POST bloqueado (`canInternoWrite`) | P1 ✅ |
| Paciente só com nome | sem cadastro | ✅ paciente provisório (CPF gerado) | P1 ✅ |
| Beneficiário login + labels | parcial | backlog fino (conta + `useLabels` residual) | P2 |
| Kits estoque sempre | inconsistente | best-effort no bridge | P2 |
| Dashboard interno = gestão | fontes distintas | gestão continua fonte do piloto | P2 |
| E2E Playwright CEDIG | smoke manual | backlog | P2 |

**Não vender ainda:** “4 portais em operação plena no dia a dia CEDIG” — a ponte desbloqueia o fluxo técnico; operação humana e massa PJ/Bem Saúde ainda evoluem.

---

## Arquitetura da ponte

```text
ClinicExamLaunch
  → ensure Patient (+ companyId pela tabela)
  → Appointment status=REALIZADO
  → ProcedureUsage (priceCharged = amountReceived)
  → Invoice FECHADA (+ Payment CONFIRMED se ≠ CONVENIO)
```

Código: `src/lib/clinic-finance/bridge.ts` · helpers `bridge-helpers.ts` · FKs no schema (`appointmentId`, `usageId`, `invoiceId`, `bridgeStatus`).

---

## Como validar (local)

1. Modo demo ou operação com tenant `cedig`
2. Interno Alana → Agenda → **Lançar na gestão** (prefill)
3. Salvar lançamento → toast com ponte SYNCED
4. Prestador do médico → agenda/extrato com o exame
5. Interno Faturamento → fatura PAGA (particular) ou FECHADA (convênio)
6. Gestão → **Exportar mês (Excel)**

Credenciais: [`README.md`](README.md).

---

## Fora de escopo desta fase

- Autocomplete de tenants no login (coberto em v2.5)
- Domínio customizado / WhatsApp
- Reescrever KPIs da gestão no dashboard executivo genérico
- Novos convênios além do seed CentralMed / Bem Saúde / Dr Saúde
