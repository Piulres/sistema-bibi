# Segmento: Engenharia / Empreiteira (`CONSTRUCTION`)

Construtoras, empreiteiras e escritórios de engenharia com gestão de obras, orçamentos, cronograma e documentação técnica.

## Glossário UI

| Chave | Termo |
|-------|-------|
| Obra (`patient`) | Obra |
| Prestador | Engenheiro |
| Procedimento | Serviço técnico |
| Consulta / Vistoria (`appointment`) | Vistoria |
| Beneficiário | Cliente |
| Prontuário | Dossiê técnico |
| Empresa (`company`) | Incorporadora |

Fonte canônica: `src/constants/niches.ts` → `NICHE_MASTER_LABELS.CONSTRUCTION`

## Acesso demo

| Papel | E-mail | Onde |
|-------|--------|------|
| Interno (admin) | `operacao@build.demo` | `/interno/projetos` |
| Engenheiro civil | `eng.carlos@build.demo` | `/login` (prestador) |
| Arquiteta | `arq.maria@build.demo` | `/login` |
| Cliente | `cliente@build.demo` | `/beneficiario/login` |
| Empresa PJ | `rh@incorp.demo` | `/pj/projetos` |

Senha: **`bibi123`** · Landing: `/?tenant=build`

## Massa demo (seed)

O seed cria o tenant **Build Engenharia** (`slug: build`) com empresas PJ, beneficiários e **3 obras** vinculadas à **Incorp Alpha** (`rh@incorp.demo`).

| Código | Status obra | Orçamento | Uso no demo |
|--------|-------------|-----------|-------------|
| `OBR-2026-001` | `EM_OBRA` (45%) | `APROVADO` + fatura emitida | Cronograma com dependências, timeline Gantt, obra em execução |
| `OBR-2026-002` | `PROPOSTA` | `ENVIADO` | **Aprovar/recusar no portal PJ** → emite fatura ao aprovar |
| `OBR-2026-003` | `ORCAMENTO` | `RASCUNHO` | Editar orçamento no interno, enviar proposta |

### O que cada obra traz

- **Orçamento** com itens, BDI, subtotal e total calculados
- **Tarefas** com datas escalonadas e cadeia de dependências (`dependsOnId`)
- **Anexo** memorial descritivo (metadado no banco; blob `seed/...` — download real só após upload pela UI)
- **Empresa PJ** Incorp Alpha com **12 beneficiários** gerados — necessário para faturamento automático ao aprovar orçamento
- **Prestadores** CREA/CAU no catálogo + procedimentos `ENG-*` (vistoria, laudo, fiscalização…)

### Fluxos validados

```
Interno: orçamento RASCUNHO → enviar PROPOSTA (ENVIADO)
    ↓
PJ: aprovar → Invoice + webhook INVOICE_ISSUED
    ou recusar → volta para ORCAMENTO

Interno: tarefas EM_ANDAMENTO → obra passa para EM_OBRA
```

## Módulo de obras

### Portal interno

| Rota | Descrição |
|------|-----------|
| `/interno/projetos` | Pipeline Kanban por status |
| `/interno/projetos/[id]` | Resumo, orçamento, cronograma (Gantt), anexos |
| `GET /api/interno/projects` | Lista ou `?view=pipeline` |
| `POST /api/interno/projects/[id]/budgets` | `send`, `approve`, `reject`, `new-version` |
| `GET .../budgets/[budgetId]/pdf` | PDF da proposta |

Nav: aba **Obras** (`labels.patients`) — **somente** quando `tenant.niche === CONSTRUCTION`.

### Portal PJ

| Rota | Descrição |
|------|-----------|
| `/pj/projetos` | Obras da empresa logada |
| `/pj/projetos/[id]` | Proposta, cronograma, anexos (somente leitura + aprovar/recusar) |
| `GET /api/pj/projects` | Lista filtrada por `companyId` da sessão |
| `POST /api/pj/projects/[id]/budgets` | `approve` / `reject` |
| `GET /api/pj/projects/[id]/budgets/[budgetId]/pdf` | PDF para o cliente |

Nav: seção **Obras** em `buildPjSectionNav` — **somente** `CONSTRUCTION`.

Alerta no overview PJ quando há propostas `ENVIADO` aguardando (`pj-portal-service.ts`).

## Impacto nos outros segmentos

O módulo de obras é **opt-in por nicho**. Demais segmentos **não** ganham novas abas, rotas visíveis nem alertas PJ.

| Área | Comportamento em MEDICAL, VET, etc. |
|------|-------------------------------------|
| Nav interno | Sem aba Obras (`niche-nav.ts` — `if (niche === CONSTRUCTION`) |
| Nav PJ | Sem seção `/pj/projetos` |
| Overview PJ | Sem alerta de propostas pendentes |
| Labels UI | Glossário do nicho ativo (`useLabels()`) — inalterado |
| Modelos Prisma | `Project`, `Budget`, etc. existem no schema global, mas **sem massa** fora do tenant `build` |
| APIs `/api/interno/projects` | Existem; retornam **lista vazia** em tenants sem obras (ex.: Horizonte Saúde) |
| RBAC `projetos` | Perfil interno pode ter permissão, mas sem nav o acesso é por URL direta |

**Princípio:** multi-nicho horizontal — código compartilhado, **UI e dados demo condicionados ao `Tenant.niche`**.

## Código

| Área | Caminho |
|------|---------|
| Labels | `src/constants/niches.ts` |
| Serviços | `src/lib/project/project-service.ts`, `constants.ts` |
| PDF | `src/lib/exports/budget-pdf.ts` |
| APIs interno | `src/app/api/interno/projects/` |
| APIs PJ | `src/app/api/pj/projects/` |
| UI interno | `src/components/projects/` |
| UI PJ | `PjProjectsView`, `PjProjectDetailView` |
| Gantt | `src/components/projects/ScheduleTimeline.tsx` |
| Seed | `prisma/seed-data/construction-projects.ts` |
| Testes | `tests/unit/project.test.ts`, `tests/api/construction-projects.test.ts` |

## Testes

```bash
npm run test -- tests/unit/project.test.ts tests/api/construction-projects.test.ts
```

Ver também `docs/plataforma/TESTES.md` (seção Obras / CONSTRUCTION).
