# CEDIG — Fase 2 / F: mapa e status

Documento do fluxo ponta a ponta após a gestão clínica (fase A–C).

**Produto:** Sistema Bibi - ServiceOS **v3.0.0** · tenant `cedig` · labels **Exame** (`useLabels()`).  
**Produção:** modo **operação** · CEDIG provisionado — [`RELEASES.md`](../../versoes/RELEASES.md).

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

## Mapa (completo desde v2.6 · em produção v3.0.0)

| Etapa | Status |
|-------|--------|
| Alana agenda + **Lançar na gestão** | ✅ |
| Lançamento → Appointment + ProcedureUsage + Invoice/Payment | ✅ |
| Médico (Prestador) vê REALIZADO / extrato | ✅ |
| PJ CentralMed / Bem Saúde / Dr Saúde | ✅ seed `rh@*.demo` + PricingRule |
| Beneficiário labels **Exame** | ✅ `useLabels()` |
| Seed histórico com ponte (usages/faturas) | ✅ backfill + `portalMass` / enrich |
| Export Excel mensal | ✅ |
| READONLY sem escrita na gestão | ✅ |
| Dashboard → atalho Gestão clínica | ✅ |
| E2E Playwright `e2e/cedig-gestao.spec.ts` | ✅ |
| Mapeamento browser 4 portais + agenda semana | ✅ 2026-07-26 · [`ACOES_OPERACIONAIS.md`](ACOES_OPERACIONAIS.md) |

**Ainda não vender como “4 portais plenos em produção”** até homologação humana in loco (pacote já publicado).

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

### Dev local (store operação)

`?tenant=cedig` força store **operation** (não demo).

```bash
npm run db:bootstrap:demo
echo operation > prisma/.data-store-mode
NEXT_PUBLIC_DISABLE_ONBOARDING_AUTO=true npm run dev
./scripts/cedig-mapear.sh   # enrich + semana + lançamentos SYNCED
```

1. Alana `/interno/gestao` → lançar → coluna Ponte **SYNCED**
2. Agenda → **Lançar na gestão** (atalho)
3. Prestador `bruno.dias@cedig.demo` · Beneficiário `maria.cedig@email.com` · PJ `rh@centralmed.demo` / `rh@bemsaude.demo` / `rh@drsaude.demo`
4. `npx playwright test e2e/cedig-gestao.spec.ts --project=chromium`
5. Exportar mês (Excel) · Dashboard mostra KPIs da gestão no mês corrente

### Produção

- Modo **operação** em `/interno/seguranca`
- Smoke: `bash scripts/cedig-golive-smoke.sh`
- Checklist: [`GO_LIVE_CHECKLIST.md`](GO_LIVE_CHECKLIST.md)

Credenciais: [`README.md`](README.md).  
Playbook: [`ACOES_OPERACIONAIS.md`](ACOES_OPERACIONAIS.md).
