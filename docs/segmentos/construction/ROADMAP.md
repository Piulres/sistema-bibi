# Roadmap Engenharia Civil — Pacotes 1–5

Especificação dos módulos entregues na branch `cursor/construction-roadmap-a43a`.

## Pacote 1 — Fundação financeira

| Módulo | Modelo / API | UI |
|--------|--------------|-----|
| Caixa da obra | `ProjectCashEntry` · `GET/POST .../cash` | Aba **Caixa** no detalhe da obra |
| Alocação prestador | `ProjectAllocation`, `ProjectAllocationPayment` · `.../allocations` | Aba **Equipe** |
| BDI decomposto | `BudgetBdiBreakdown` · `.../bdi` | Aba **BDI** |

## Pacote 2 — Orçamento técnico

| Módulo | Modelo / API | UI |
|--------|--------------|-----|
| Ambientes + medidas | `ProjectEnvironment` · `.../environments` | Aba **Ambientes** (calculadora m²) |
| Composição custo | `BudgetLineItem.laborCost`, `materialCost` | Orçamento (campos no schema) |

## Pacote 3 — Físico-financeiro

| Módulo | Modelo / API | UI |
|--------|--------------|-----|
| Cronograma financeiro | `ProjectTask.planned*` / `actual*` | Aba **Físico-financeiro** |
| Relatório gerencial | `.../financial-report` | Aba + `/interno/projetos/financeiro` |
| Indiretas empresa | `CompanyIndirectExpense` · `/api/interno/construction/finance` | Página financeiro |

## Pacote 4 — Comercial

| Módulo | Modelo / API | UI |
|--------|--------------|-----|
| Pipeline obras | `ConstructionPipelineEntry` · `/api/interno/construction/pipeline` | `/interno/projetos/pipeline` |
| Metas BDI | `ConstructionSalesGoal` · `/api/interno/construction/goals` | Pipeline (metas via API) |

## Pacote 5 — Cliente e contrato

| Módulo | Modelo / API | UI |
|--------|--------------|-----|
| Portal cliente | `listProjectsForPatient` · `/api/beneficiario/projects` | `/beneficiario/obras` (CONSTRUCTION) |
| Contratos + aditivos | `ProjectContract`, `ContractAddendum` · `.../contracts` | Aba **Contratos** |

## Demo

`/?tenant=build` · `operacao@build.demo` · OBR-2026-001 com caixa, ambientes, contrato CT-2026-001 + aditivo.

Seed: `prisma/seed-data/construction-roadmap.ts`
