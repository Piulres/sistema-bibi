# Segmento: Veterinária (`VET`)

Clínicas veterinárias, pet shops e auxílio pet corporativo.

## Glossário UI

| Chave | Termo |
|-------|-------|
| Paciente | Pet |
| Prestador | Veterinário |
| Procedimento | Serviço |
| Consulta | Atendimento |
| Beneficiário | Tutor |
| Prontuário | Ficha clínica |

## Demo

| Papel | E-mail | Tenant |
|-------|--------|--------|
| Interno | `operacao@petcare.demo` | PetCare |
| Prestador | `dr.rafael@petcare.demo` | PetCare |
| Tutor (beneficiário) | `tutor@petcare.demo` | PetCare |
| Empresa PJ | `rh@techpet.demo` | PetCare |

Senha: **`bibi123`**

Catálogo demo: consulta, vacinação, exames, cirurgia, internação e estética (banho/tosa). Massa operacional com histórico e agendamentos futuros.

## Pesquisa

- [Pesquisa de mercado VET](./pesquisa.md)

## Código

- Seed: `prisma/seed-data/niche-catalogs.ts` · `prisma/seed-data/niche-operational.ts`
- Landing: `/?tenant=petcare`
