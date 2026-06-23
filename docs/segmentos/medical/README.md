# Segmento: Saúde (`MEDICAL`)

Vertical de referência do ServiceOS — clínicas, operadoras e saúde corporativa.

## Glossário UI

| Chave | Termo |
|-------|-------|
| Paciente | Paciente |
| Prestador | Prestador |
| Procedimento | Procedimento |
| Consulta | Consulta |
| Beneficiário | Beneficiário |
| Prontuário | Prontuário |

## Demo

| Papel | E-mail | Tenant |
|-------|--------|--------|
| Interno (admin) | `faturamento@bibi.health` | Clínica Horizonte |
| Prestador | `dra.helena@bibi.health` | Clínica Horizonte |
| Beneficiário | `joao.pereira@email.com` | TechCorp |
| PJ | `rh@techcorp.com` | TechCorp |

Senha: **`bibi123`**

## Pesquisa

- [Expansão HealthOS 2026](./pesquisa-expansao-2026.md)
- [Síntese consultor](../pesquisa/09-sintese-consultor-senior.md) (ROI corporativo)

## Código

- Labels: `NICHE_MASTER_LABELS.MEDICAL` em `src/constants/niches.ts`
- Landing: `/?niche=MEDICAL` ou `/` (padrão)
