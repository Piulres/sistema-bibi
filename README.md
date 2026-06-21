# Sistema Bibi

> Plataforma SaaS **HealthTech** (POC) para gestão inteligente de clínicas e
> hospitais, inspirada no modelo **ERPMed/Centtralmed**. Foco em **Pay Per Use**,
> previsibilidade financeira, extinção da burocracia e fidelização de pacientes.

---

## Índice

1. [Visão geral](#1-visão-geral)
2. [Pilares de negócio](#2-pilares-de-negócio)
3. [Arquitetura e stack](#3-arquitetura-e-stack)
4. [Início rápido](#4-início-rápido)
5. [URLs de teste](#5-urls-de-teste) ← *as rotas para você acessar*
6. [Credenciais de demonstração](#6-credenciais-de-demonstração)
7. [Fluxo end-to-end (Pay Per Use)](#7-fluxo-end-to-end-pay-per-use)
8. [Modelo de dados](#8-modelo-de-dados)
9. [Referência da API](#9-referência-da-api)
10. [Estrutura de pastas](#10-estrutura-de-pastas)
11. [Scripts disponíveis](#11-scripts-disponíveis)
12. [Segurança e LGPD](#12-segurança-e-lgpd)
13. [Notas técnicas e limitações da POC](#13-notas-técnicas-e-limitações-da-poc)
14. [Documentação adicional](#14-documentação-adicional)

---

## 1. Visão geral

O Sistema Bibi é uma plataforma multi-tenant (cada clínica/hospital é um *tenant*)
com **três portais segregados** por perfil de acesso. O objetivo da POC é
demonstrar o modelo de negócio **Pay Per Use**: o beneficiário paga apenas pelos
serviços (consultas e exames) efetivamente utilizados, com transparência prévia
de valores e faturamento sem perdas de informação.

| Portal | Público | Foco |
|--------|---------|------|
| **Portal do Prestador** | Médicos / profissionais de saúde | Agenda inteligente e prontuário eletrônico (PEP) |
| **Portal Interno** | Equipe administrativa | Faturamento Pay Per Use e administração |
| **Portal da Empresa (PJ)** | RH / gestores corporativos | Contratos e beneficiários corporativos |

## 2. Pilares de negócio

- **Pay Per Use** — cada procedimento utilizado é registrado com o preço
  *congelado* no momento do uso (snapshot), garantindo transparência prévia.
- **Precificação dinâmica** — regras por empresa ajustam o preço base (ex.:
  desconto corporativo de 15% para a TechCorp em consultas clínicas).
- **Previsibilidade financeira** — o faturamento agrega apenas o que foi usado e
  pode ser fechado ao final do atendimento ("fechado na alta").
- **Eficiência operacional** — fluxos curtos: agenda → atendimento → prontuário →
  faturamento, sem telas excessivas (anti *over-engineering*).
- **Mobile-first & nuvem** — interface responsiva, acessível de qualquer
  dispositivo.

## 3. Arquitetura e stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | **Next.js 16** (App Router) |
| UI | **React 19** + **Tailwind CSS v4** (mobile-first) |
| Linguagem | **TypeScript** |
| ORM / Banco | **Prisma 6** + **SQLite** (dev) |
| Autenticação | Cookie de sessão **httpOnly** assinado com **HMAC-SHA256** |
| Proteção de rotas | `src/proxy.ts` (o "Proxy" do Next 16, antigo middleware) |

A API é exposta via **Route Handlers** (`src/app/api/**`). As páginas de dashboard
são *Server Components* que validam a sessão e o `role` no servidor antes de
renderizar os componentes de cliente que consomem a API.

## 4. Início rápido

Requisitos: **Node.js 20+** (testado com Node 22) e **npm**.

```bash
npm install            # instala dependências (postinstall roda `prisma generate`)
cp .env.example .env   # cria as variáveis de ambiente locais
npm run db:reset       # cria o schema SQLite e popula os dados de demonstração
npm run dev            # inicia o servidor de desenvolvimento
```

A aplicação sobe em **http://localhost:3000**.

> Variáveis de ambiente (`.env`):
> - `DATABASE_URL` — caminho do SQLite (padrão `file:./dev.db`).
> - `SESSION_SECRET` — segredo usado para assinar o cookie de sessão.

## 5. URLs de teste

Base local: **`http://localhost:3000`**
(na rede interna da VM o servidor também responde em `http://172.30.0.2:3000`).

### Páginas (interface)

| URL | Página | Acesso |
|-----|--------|--------|
| `/` | Landing page com seleção de portal | Público |
| `/login` | Login do **Portal do Prestador** | Público |
| `/prestador` | Dashboard do prestador (agenda do dia) | `PRESTADOR` |
| `/prestador/atendimento/{id}` | Detalhe do atendimento (procedimentos + PEP) | `PRESTADOR` |
| `/interno/login` | Login do **Portal Interno** | Público |
| `/interno` | Dashboard de faturamento (Pay Per Use) | `INTERNO` |
| `/interno/beneficiarios/{id}` | **Cliente 360°** — visão consolidada do beneficiário | `INTERNO` |
| `/pj/login` | Login do **Portal da Empresa (PJ)** | Público |
| `/pj` | Dashboard corporativo (beneficiários e faturas) | `PJ` |

> As rotas protegidas redirecionam para o login do portal correspondente quando
> não há sessão válida.

### Links rápidos para teste

- Landing: http://localhost:3000/
- Prestador: http://localhost:3000/login
- Interno: http://localhost:3000/interno/login
- Empresa (PJ): http://localhost:3000/pj/login

## 6. Credenciais de demonstração

Criadas automaticamente pelo seed (`prisma/seed.ts`). Senha única: **`bibi123`**.

| Portal | URL de login | E-mail | Senha |
|--------|--------------|--------|-------|
| Prestador | `/login` | `dra.helena@bibi.health` | `bibi123` |
| Interno | `/interno/login` | `faturamento@bibi.health` | `bibi123` |
| Empresa PJ | `/pj/login` | `rh@techcorp.com` | `bibi123` |

> Cada conta só acessa o portal correspondente ao seu `role`; tentar usar uma
> conta em outro portal retorna erro de acesso.

## 7. Fluxo end-to-end (Pay Per Use)

1. **Prestador** faz login em `/login` e vê a **agenda do dia**.
2. Abre um atendimento e **registra os procedimentos utilizados** — o preço é
   calculado com a precificação dinâmica e congelado no uso.
3. Registra a evolução no **prontuário eletrônico (PEP)** e marca o atendimento
   como **REALIZADO**.
4. **Interno** faz login em `/interno/login`, vê os **procedimentos pendentes de
   faturamento** agrupados por beneficiário e **gera a fatura** (Pay Per Use).
5. **Empresa (PJ)** acompanha em `/pj` o **consumo dos beneficiários** e as
   **faturas** emitidas para a empresa.

Exemplo de precificação dinâmica do seed: a Consulta Clínica (base R$ 180,00)
para um beneficiário da **TechCorp** é cobrada por **R$ 153,00** (desconto
corporativo de 15%).

## 8. Modelo de dados

Definido em [`prisma/schema.prisma`](prisma/schema.prisma). Principais entidades:

| Modelo | Descrição |
|--------|-----------|
| `Tenant` | Cliente do SaaS (clínica/hospital). Base do multi-tenancy. |
| `User` | Usuário do sistema; `role` define o portal (`PRESTADOR`/`INTERNO`/`PJ`). |
| `Company` | Empresa contratante (PJ). |
| `Patient` | Beneficiário/paciente (individual ou vinculado a uma empresa). |
| `Procedure` | Catálogo de procedimentos (consultas/exames) com preço base. |
| `PricingRule` | Precificação dinâmica (multiplicador por empresa). |
| `Appointment` | Agendamento (agenda inteligente). |
| `ProcedureUsage` | **Uso efetivo de procedimento — núcleo do Pay Per Use** (preço congelado). |
| `MedicalRecord` | Prontuário eletrônico (PEP). |
| `Invoice` / `InvoiceItem` | Fatura Pay Per Use e seus itens. |
| `TimelineEvent` | Auditoria universal de eventos (Timeline). |

> SQLite não suporta enums no Prisma; os campos `role`, `status` e `category` são
> `String` com valores documentados no schema.

### Diagrama de relacionamento (simplificado)

```
Tenant 1─┬─* User ───* Appointment ───* ProcedureUsage ──1 InvoiceItem
         ├─* Company ─* Patient ──┘                  └─* (Procedure)
         ├─* Procedure ─* PricingRule
         └─* Invoice ─* InvoiceItem
```

## 9. Referência da API

Todas as rotas vivem em `src/app/api/**` e exigem sessão válida (exceto login).
Erros retornam `{ "error": "mensagem" }` com o status HTTP adequado
(`401` não autenticado, `403` portal/role incorreto, `400` dados inválidos).

### Autenticação

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/auth/login` | Login. Body: `{ email, password, portal }` (portal: `prestador`\|`interno`\|`pj`). |
| `POST` | `/api/auth/logout` | Encerra a sessão. |
| `GET` | `/api/auth/me` | Retorna o usuário da sessão atual. |

### Portal do Prestador (`role: PRESTADOR`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/prestador/agenda` | Agenda do dia do prestador logado. |
| `GET` | `/api/prestador/appointments/{id}` | Detalhe do atendimento (procedimentos + PEP). |
| `PATCH` | `/api/prestador/appointments/{id}` | Atualiza o status. Body: `{ status }`. |
| `POST` | `/api/prestador/appointments/{id}/procedures` | Registra um procedimento (Pay Per Use). Body: `{ procedureId }`. |
| `POST` | `/api/prestador/records` | Adiciona anotação ao PEP. Body: `{ patientId, appointmentId?, content }`. |
| `GET` | `/api/procedures` | Catálogo de procedimentos (também acessível ao `INTERNO`). |

### Portal Interno (`role: INTERNO`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/interno/billing` | Procedimentos pendentes (agrupados) e faturas emitidas. |
| `GET` | `/api/interno/patients/{id}/overview` | Visão **Cliente 360°** consolidada de um beneficiário. |
| `POST` | `/api/interno/invoices` | Gera a fatura Pay Per Use de um paciente. Body: `{ patientId }`. |

### Portal da Empresa (`role: PJ`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/pj/overview` | Contrato, beneficiários e faturas da empresa do usuário. |

### Documentação interativa (Swagger UI)

Com o servidor rodando, explore e teste a API direto do navegador:

- **Swagger UI:** http://localhost:3000/api-docs.html
- **Especificação OpenAPI 3.0 (YAML):** http://localhost:3000/openapi.yaml
  (fonte em [`public/openapi.yaml`](public/openapi.yaml))

### Exemplo com `curl`

```bash
# 1) Login (salva o cookie de sessão)
curl -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dra.helena@bibi.health","password":"bibi123","portal":"prestador"}'

# 2) Agenda do dia
curl -b cookies.txt http://localhost:3000/api/prestador/agenda
```

## 10. Estrutura de pastas

```
sistema-bibi/
├── prisma/
│   ├── schema.prisma        # modelo de dados (multi-tenant + Pay Per Use)
│   └── seed.ts              # dados de demonstração
├── src/
│   ├── app/
│   │   ├── api/             # Route Handlers (backend)
│   │   │   ├── auth/        # login, logout, me
│   │   │   ├── prestador/   # agenda, atendimentos, procedimentos, PEP
│   │   │   ├── interno/     # billing, invoices
│   │   │   ├── pj/          # overview
│   │   │   └── procedures/  # catálogo
│   │   ├── login/           # /login (Prestador)
│   │   ├── interno/         # /interno, /interno/login, /interno/beneficiarios/[id]
│   │   ├── pj/              # /pj e /pj/login
│   │   ├── prestador/       # /prestador e /prestador/atendimento/[id]
│   │   ├── layout.tsx       # layout raiz (pt-BR)
│   │   └── page.tsx         # landing page
│   ├── components/          # componentes de cliente (views/forms)
│   ├── lib/                 # db, sessão, roles, precificação, auth, patient-overview, timeline
│   └── proxy.ts             # proteção de rotas (Next 16 "Proxy")
├── .env.example
└── README.md
```

## 11. Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento (http://localhost:3000). |
| `npm run build` | Build de produção (inclui verificação de tipos). |
| `npm run start` | Sobe o build de produção. |
| `npm run lint` | ESLint. |
| `npm run db:push` | Sincroniza o schema com o banco SQLite. |
| `npm run db:seed` | Popula o banco com os dados de demonstração. |
| `npm run db:reset` | Recria o banco (force-reset) e roda o seed. |

## 12. Segurança e LGPD

- Sessão por **cookie httpOnly** assinado com **HMAC-SHA256** (`SESSION_SECRET`),
  com comparação em tempo constante na verificação.
- **Segregação por `role`**: cada portal valida o perfil tanto no `proxy.ts`
  (checagem otimista) quanto no servidor (validação real em cada handler/página).
- Dados sensíveis (prontuário, beneficiários) ficam isolados por `tenant`.

> ⚠️ **POC**: as senhas estão em texto puro apenas para demonstração
> (ver `prisma/seed.ts`). Em produção, use hash (bcrypt/argon2), HTTPS,
> criptografia de dados em repouso e auditoria de acesso.

## 13. Notas técnicas e limitações da POC

- **Prisma fixado na linha 6** de propósito: o Prisma 7 remove `url` do datasource
  e exige *driver adapters* + `prisma.config.ts` (quebraria o schema atual).
- **Middleware virou "Proxy" no Next 16**: a proteção de rotas está em
  `src/proxy.ts` (não há `middleware.ts`).
- `params`, `searchParams` e `cookies()` são **assíncronos** (use `await`).
- Banco **SQLite** local para facilitar o desenvolvimento; o arquivo `dev.db` e o
  `.env` são *gitignored*.
- POC sem testes automatizados e sem hashing de senha — itens recomendados para a
  evolução do produto.

## 14. Documentação adicional

- **Arquitetura e diagramas** (componentes, ER e fluxos Mermaid):
  [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md)
- **API interativa (Swagger UI):** http://localhost:3000/api-docs.html
- **Especificação OpenAPI:** [`public/openapi.yaml`](public/openapi.yaml)

---

Construído como POC para validar o modelo de negócio do **Sistema Bibi**.
