# Sistema Bibi

Plataforma SaaS HealthTech (POC) para gestão inteligente de clínicas e hospitais,
inspirada no modelo ERPMed/Centtralmed: foco em **Pay Per Use**, previsibilidade
financeira e fidelização de pacientes.

## Funcionalidades (POC)

- **Multi-tenancy com 3 portais segregados**
  - Portal do Prestador (`/login`): agenda do dia e prontuário eletrônico (PEP).
  - Portal Interno (`/interno/login`): faturamento Pay Per Use e administração.
  - Portal da Empresa/PJ (`/pj/login`): contratos e beneficiários corporativos.
- **Pay Per Use** com precificação dinâmica (descontos corporativos por empresa).
- **Faturamento** que agrega apenas os procedimentos efetivamente utilizados.
- Interface **mobile-first** e em conformidade com os princípios de LGPD (sessão
  assinada via cookie httpOnly).

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Prisma 6 · SQLite.

## Início rápido

```bash
npm install            # instala deps (postinstall: prisma generate)
cp .env.example .env   # cria as variáveis locais
npm run db:reset       # cria o schema SQLite e popula dados de demonstração
npm run dev            # http://localhost:3000
```

### Credenciais de demonstração

| Portal      | Login                       | Senha   |
|-------------|-----------------------------|---------|
| Prestador   | `dra.helena@bibi.health`    | bibi123 |
| Interno     | `faturamento@bibi.health`   | bibi123 |
| Empresa PJ  | `rh@techcorp.com`           | bibi123 |

## Scripts

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção
- `npm run lint` — ESLint
- `npm run db:push` / `npm run db:seed` / `npm run db:reset` — banco SQLite
