# CEDIG — Fase 2 / F: mapa e status

Documento do fluxo ponta a ponta após a gestão clínica (fase A–C).

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

## Mapa (v2.6 completo)

| Etapa | Status |
|-------|--------|
| Alana agenda + **Lançar na gestão** | ✅ |
| Lançamento → Appointment + ProcedureUsage + Invoice/Payment | ✅ |
| Médico (Prestador) vê REALIZADO / extrato | ✅ |
| PJ CentralMed / Bem Saúde / Dr Saúde | ✅ seed `rh@*.demo` + PricingRule |
| Beneficiário labels **Exame** | ✅ `useLabels()` |
| Seed histórico com ponte (usages/faturas demo) | ✅ backfill + novos seeds |
| Export Excel mensal | ✅ |
| READONLY sem escrita na gestão | ✅ |
| Dashboard → atalho Gestão clínica | ✅ |
| E2E Playwright `e2e/cedig-gestao.spec.ts` | ✅ |

**Ainda não vender como “4 portais plenos em produção”** até homologação humana in loco (pacote **v2.6.0** já publicado — ver [`GO_LIVE_CHECKLIST.md`](GO_LIVE_CHECKLIST.md)).

---

## Arquitetura da ponte

```text
ClinicExamLaunch
  → ensure Patient (provisório se necessário; não sobrescreve companyId)
  → Appointment status=REALIZADO
  → ProcedureUsage (priceCharged = amountReceived)
  → Invoice FECHADA (+ Payment se ≠ CONVENIO; companyId pela tabela)
```

Código: `src/lib/clinic-finance/bridge.ts` · `bridge-helpers.ts`.

---

## Como validar

1. `npm run db:seed` (ou ensure CEDIG) — massa com lançamentos SYNCED  
2. Alana `/interno/gestao` → lançar → coluna Ponte **SYNCED**  
3. Agenda → **Lançar na gestão**  
4. Prestador `bruno.dias@cedig.demo` · Beneficiário `maria.cedig@email.com` · PJ `rh@centralmed.demo` / `rh@bemsaude.demo` / `rh@drsaude.demo`  
5. `npx playwright test e2e/cedig-gestao.spec.ts --project=chromium` (6/6)  
6. Exportar mês (Excel) · Dashboard mostra KPIs da gestão no mês corrente

Credenciais: [`README.md`](README.md).
