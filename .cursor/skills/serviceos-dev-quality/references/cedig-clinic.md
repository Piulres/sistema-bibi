# CEDIG — gestão clínica

## Docs vivas

- `docs/clientes/cedig/STATUS.md` — status do piloto
- `docs/clientes/cedig/OPERACAO.md` — operação local
- `docs/produto/DOCUMENTOS_CLINICOS.md` — atestado, receita, protocolos de exames (v3.0.5)
- `AGENTS.md` em `docs/clientes/cedig/`

## Código canônico

- `src/lib/clinic-finance/bridge.ts` — ponte clínica ↔ faturamento
- `src/lib/clinic-finance/month-strip.ts` — KPIs leves da faixa superior (receita/exames/despesas/lucro a partir das listas)
- `src/components/ClinicFinanceView.tsx` — UI `/interno/gestao` (soft refresh, meta uma vez, `/kpis` sob demanda)
- `src/lib/care-journey.ts` — stepper Agendado → Pago no prestador/beneficiário
- `src/lib/exam-protocol-service.ts` — templates e aplicação em lote de protocolos de exames
- `src/lib/clinical/atestado.ts` · `src/lib/clinical/receita.ts` — documentos estruturados CFM
- `/interno/gestao` — gestão clínica (MEDICAL/DENTAL)
- Tenant demo: `/?tenant=cedig`

## Regras

- Atualizar `STATUS.md` ao fechar entrega CEDIG — não criar `FASE_N` / `GO_LIVE_*`
- Modo operação: ver `docs/plataforma/OPERACAO_DADOS.md`
- Reset de fluxos em produção: **não** usar `db:reset` nem “Restaurar demo” — ver `OPERACAO.md` §Limpar fluxos
- **KPI strip (v3.0.15):** não chamar `/kpis` no boot — usar `summarizeClinicMonthStrip()`; `/kpis` só na aba Indicadores
- **Soft refresh:** trocar mês ou salvar lançamento usa `loadPeriod({ soft: true })` — não resetar `bootLoading`

## Scripts operacionais

| Script | Quando |
|--------|--------|
| `scripts/cedig-mapear.sh` | Enrich local (dev) |
| `scripts/reset-cedig-transactional.mjs` | Zerar atendimentos/fluxos no Blob (`--confirm=LIMPAR-FLUXOS`) |
| `scripts/cedig-ensure-commercial.ts` | Restaurar empresas + PricingRules após reset |
| `scripts/publish-operation-blob.mjs` | Republicar `operation.db` com `updatedAt` |
| `scripts/cleanup-operation-test-data.mjs` | Limpeza pontual (duplicatas, massa smoke) |
