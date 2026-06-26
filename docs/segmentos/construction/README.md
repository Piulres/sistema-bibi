# Segmento: Engenharia / Empreiteira (`CONSTRUCTION`)

Construtoras, empreiteiras e escritórios de engenharia com gestão de obras.

## Glossário UI

| Chave | Termo |
|-------|-------|
| Obra (`patient`) | Obra |
| Prestador | Engenheiro |
| Procedimento | Serviço técnico |
| Consulta | Vistoria |
| Beneficiário | Cliente |
| Prontuário | Dossiê técnico |

## Demo

| Papel | E-mail | Tenant |
|-------|--------|--------|
| Interno | `operacao@build.demo` | Build Engenharia |
| Engenheiro civil | `eng.carlos@build.demo` | Build Engenharia |
| Arquiteta | `arq.maria@build.demo` | Build Engenharia |
| Cliente | `cliente@build.demo` | Build Engenharia |
| Empresa PJ | `rh@incorp.demo` | Build Engenharia |

Senha: **`bibi123`**

## Módulo de obras

- Lista/pipeline: `/interno/projetos`
- Detalhe (orçamento, cronograma, anexos): `/interno/projetos/[id]`
- Landing: `/?tenant=build`

Obras demo no seed:
- `OBR-2026-001` — Em obra (45%)
- `OBR-2026-002` — Proposta enviada
- `OBR-2026-003` — Orçamento em rascunho

## Código

- Labels: `src/constants/niches.ts`
- Serviços: `src/lib/project/`
- APIs: `src/app/api/interno/projects/`
- UI: `src/components/projects/`
- Seed: `prisma/seed-data/construction-projects.ts`
