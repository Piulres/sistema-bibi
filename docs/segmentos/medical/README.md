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

- [Expansão segmento saúde 2026](./pesquisa-expansao-2026.md)
- [Síntese consultor](../../pesquisa/09-sintese-consultor-senior.md) (ROI corporativo)

## Comercial

- [Playbook de captação e vendas MEDICAL](./COMERCIAL.md)

## Cliente piloto

- [CEDIG Cruzeiro](../../clientes/cedig/README.md) — endoscopia/colonoscopia · gestão clínica (`/interno/gestao`) · labels **Exame** · produção **v3.0.25** (modo operação)
- [Playbook de ações CEDIG](../../clientes/cedig/OPERACAO.md)

## Código

- Labels: `NICHE_MASTER_LABELS.MEDICAL` em `src/constants/niches.ts`
- Landing: `/?niche=MEDICAL` ou `/` (padrão)
- Gestão clínica: `src/lib/clinic-finance/` · `/interno/gestao`
