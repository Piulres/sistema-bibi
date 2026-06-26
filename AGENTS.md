<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

### O que é o Sistema Bibi - ServiceOS (v2.0)
Infraestrutura horizontal **ServiceOS** — plataforma **multi-segmento** Pay Per Use com **quatro portais**
segregados por `role`: **Prestador** (`/login` → `/prestador`), **Interno** (`/interno/login` →
`/interno/dashboard`), **Empresa/PJ** (`/pj/login` → `/pj`) e **Beneficiário**
(`/beneficiario/login` → `/beneficiario`). Núcleo de negócio: faturamento
**Pay Per Use** sobre qualquer tipo de serviço (consulta médica, hora jurídica, aula de yoga…).

**Multi-nicho (v2.0):** cada `Tenant` possui `niche` (`MEDICAL`|`VET`|`DENTAL`|`LEGAL`|`SPA`|`EDUCATION`)
e `labels` (JSON) para tradução automática da UI.

**Dicionário mestre (obrigatório):** `src/constants/niches.ts` — `NICHE_MASTER_LABELS` com todas as chaves tipadas (`NicheLabelKey`). Novo nicho = novo bloco aqui; o TypeScript falha se faltar termo.

**Hook de UI:** `useLabels()` em `src/hooks/useLabels.tsx` — use `labels.patient` em JSX, nunca strings fixas como "Paciente". Provider em `PortalShell`.

**Regra para IAs:** consulte `docs/prompts/README.md` e `docs/prompts/SERVICEOS_V2_IMPLEMENTATION.md` antes de features novas. Não usar *HealthOS* nem posicionamento só-saúde em código/docs v2.0.

**Roteamento por segmento:** `?tenant=petcare` · cookie `bibi_segment` · `docs/segmentos/README.md`

**Regra labels:** ao criar qualquer tela nos portais autenticados, **consulte `NICHE_MASTER_LABELS` e use `useLabels()`** — a nomenclatura vem do tenant ativo.

### Glossário por nicho (padrão)

| Nicho | patient | provider | procedure | appointment | beneficiary |
|-------|---------|----------|-----------|-------------|-------------|
| MEDICAL | Paciente | Prestador | Procedimento | Consulta | Beneficiário |
| VET | Pet | Veterinário | Serviço | Atendimento* | Tutor |
| DENTAL | Paciente | Prestador | Proced. odontológico | Consulta odontológica | Beneficiário |
| LEGAL | Cliente | Advogado | Serviço jurídico | Atendimento | Cliente |
| SPA | Cliente | Profissional | Sessão | Agendamento | Cliente |
| EDUCATION | Aluno | Instrutor | Aula | Aula | Aluno |

\* Demo PetCare no seed sobrescreve `appointment` → "Banho/Tosa" via `Tenant.labels`.

Paletas white label por nicho. Ver `docs/versoes/V2_0.md` e `docs/versoes/V2_0_ARCHITECTURE.md`.

**Tiers mergeados (PRs #17–#23):** ciclo de receita (PIX mock), operação (CRUD,
agenda, relatórios, PEP), B2B (RBAC, webhooks, portal PJ, LGPD), enterprise
(MFA TOTP, telemedicina, TISS XML, webhook retry), docs completas e UI PIX no faturamento interno.
**Deploy (PRs #26–#28):** ambiente Cloud Agent, tentativa Netlify Agent (#27) e
fix produção Blobs regional + Prisma `rhel-openssl-3.0.x` (#28).
**Produção:** https://sistema-bibi.netlify.app — pode retornar **503 `usage_exceeded`**
(cota Netlify). Produção: **`v2.2.0`** — **Sistema Bibi - ServiceOS** @ https://sistema-bibi.netlify.app · ver `docs/versoes/RELEASES.md` (deploy atual).
**Fluxo dev-first:** novas atividades em PR → **`dev`**; release merge `dev` → `main`.
**Workflow:** desenvolver local → `npm run pre-release` → deploy manual só quando o usuário pedir.
Ver `docs/plataforma/WORKFLOW_CURSOR.md` e **`docs/plataforma/OPERACOES.md`** (mapa completo de operações).
**Preferências IA:** `AGENTS.md` · `docs/prompts/README.md` · `.cursor/rules/serviceos-dev.mdc` · `.cursor/rules/operacoes-bibi.mdc`.
**Evidências:** `docs/evidencias/` (vídeos/screenshots dos fluxos validados).
**Histórico 21/06:** `docs/plataforma/HISTORICO_2026-06-21.md`

### Stack e como rodar
- **Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4**, **Prisma 6 + SQLite**.
- Comandos padrão estão em `package.json`: `npm run dev`, `npm run build`, `npm run lint`.
- Banco local (Prisma + SQLite): primeiro setup em uma VM nova exige criar o `.env`
  e popular o banco (o `dev.db` e o `.env` são gitignored, então **não** vêm no checkout):
 - `cp .env.example .env` (se `.env` não existir)
 - `npm run db:reset` (faz `prisma db push --force-reset` + seed) ou `npm run db:push && npm run db:seed`
- O `postinstall` roda `prisma generate` automaticamente no `npm install`.
- **Agentes (Cursor): `npm run db:reset` é BLOQUEADO** — qualquer comando Prisma
 destrutivo (`--force-reset`/`migrate`) dispara um prompt de consentimento e aborta.
 Em VM nova use o caminho não destrutivo `npm run db:push && npm run db:seed`
 (o `.env` e o `dev.db` ficam no snapshot da VM, então isso é só no primeiro setup).

### Credenciais de demonstração (criadas pelo seed)
Senha única: **`bibi123`** (hash **scrypt** via `src/lib/password.ts`).

Massa demo (PR #31): **50 empresas PJ**, **199 beneficiários**, **27 usuários PJ** + fluxo demo TechCorp intacto.

| Portal | E-mail |
|--------|--------|
| Prestador | `dra.helena@bibi.health` |
| Interno (admin) | `faturamento@bibi.health` |
| Interno (faturamento / RBAC) | `financeiro@bibi.health` |
| Interno (recepção / RBAC) | `recepcao@bibi.health` |
| Interno (MFA demo) | `seguranca@bibi.health` — secret TOTP `JBSWY3DPEHPK3PXP` |
| Empresa PJ | `rh@techcorp.com` |
| Beneficiário | `joao.pereira@email.com` |
| Beneficiário (particular) | `pedro.almeida@email.com` |
| VitaCare (white-label) | `operacao@vitacare.demo` |

Volume do seed: `SEED_SCALE=small|medium|large` no `.env` (padrão `medium`).

**Restaurar modo demo:** `/interno/seguranca` → botão “Restaurar estado original do seed” (somente ADMIN; em produção via `ALLOW_DEMO_RESET=true` no `netlify.toml`).
### Operações e preferências de IA

**Manual completo:** `docs/plataforma/OPERACOES.md` · **Regras Cursor:**
`.cursor/rules/operacoes-bibi.mdc` (core) · `netlify-release.mdc` (deploy) · `stack-nextjs.mdc` (código)

| Operação | Comando | Agente pode? |
|----------|---------|--------------|
| Desenvolver | `npm run dev` | ✅ Sim |
| Emular Netlify | `npm run netlify:dev` | ✅ Sim |
| Lint | `npm run lint` | ✅ Sim |
| Validar pacote | `npm run pre-release` | ✅ Sim (não publica) |
| Setup banco VM nova | `db:push && db:seed` | ✅ Sim |
| Reset banco | `npm run db:reset` | ❌ Bloqueado |
| Deploy produção | `netlify deploy --prod` | ❌ Só se usuário pedir |
| Atualizar release | `docs/versoes/RELEASES.md` + changelog landing | ❌ Só após deploy confirmado |
| Abrir PR | base **`dev`** | ❌ PR direto na `main` |

**Modelo:** pacotes fechados — `dev` integra features; `main` é release; produção muda só com deploy manual humano.

**Versões:** `1.0.x` histórico — `docs/versoes/V1_0.md`. Produção: **`v2.2.0`** — `docs/versoes/V2_2.md` · `docs/versoes/V2_1.md` · `docs/versoes/V2_0.md` · `docs/versoes/RELEASES.md`.

**Branches:** `cursor/*` → PR → **`dev`** → (fechar pacote) → `main`. Agentes **nunca** abrem PR contra `main`.

**503 `usage_exceeded`:** cota Netlify, não bug. Não investigar em loop nem redeployar automaticamente.

**Árvore rápida:**
- Feature/bug → dev local + lint → PR → `dev`
- Validar release → `pre-release` (na `main` após merge de `dev`)
- Produção fora → `curl` uma vez; se `usage_exceeded`, avisar usuário
- Publicar → só com pedido explícito; seguir `OPERACOES.md` §5

### Variáveis de ambiente relevantes (`.env.example`)

Mapa completo: [`docs/plataforma/VARIAVEIS_AMBIENTE.md`](docs/plataforma/VARIAVEIS_AMBIENTE.md) (inclui Netlify, CI, testes e **Cursor Cloud Agent**).

- `DATABASE_URL` — SQLite (`file:./dev.db`); dual-store gera `demo.db` + `operation.db` no build — ver `docs/plataforma/OPERACAO_DADOS.md`
- `DUAL_DATA_STORE` — seletor demo/operação (`true` em dev e Netlify)
- `DATA_STORE_MODE` — modo inicial (`demo` \| `operation`) se Blobs vazio
- `SESSION_SECRET` — cookie de sessão + MFA
- `PAYMENT_GATEWAY=mock` — adapter PIX POC
- `COMMUNICATION_PROVIDER=console` — e-mail no console
- `CRON_SECRET` — jobs `/api/cron/*`
- `TELEMEDICINE_BASE_URL` — salas de telemedicina mock
- `SEED_SCALE` — volume da massa (`small` | `medium` | `large`)
- `ALLOW_DEMO_RESET` — restaurar demo na UI (somente modo **demo** ativo)
- **Demo vs operação:** `/interno/seguranca` (ADMIN) — `docs/plataforma/OPERACAO_DADOS.md`

### Navegação SPA (layouts persistentes)

| Portal | Layout | Nav | Breadcrumbs |
|--------|--------|-----|-------------|
| Interno | `src/app/interno/layout.tsx` | `InternoNav` — **13 abas** + drawer mobile | Cliente 360° (`buildPatientBreadcrumbs`) |
| Prestador | `src/app/prestador/layout.tsx` | `PrestadorNav` | Atendimento (`buildAtendimentoBreadcrumbs`) |
| PJ | `src/app/pj/layout.tsx` | `SectionNav` — 4 seções | — |
| Beneficiário | `src/app/beneficiario/layout.tsx` | `SectionNav` — **11 abas** | — |
| Landing | — | `LandingHeader` + `LandingMobileMenu` · `#novidades` (changelog) | — |

**Changelog na home:** seção `#novidades` alimentada por `src/lib/landing/changelog-content.ts`. **Atualizar sempre ao fechar pacote** — ver `docs/plataforma/LANDING_CHANGELOG.md` (junto com `RELEASES.md` e `src/lib/platform.ts`). Validar com `npm run docs:verify`.

**Config:** `src/lib/navigation/routes.ts` · **Padrão:** pages só com `PageHeader` + view (não repetir `PortalShell`/`InternoNav`).

### Operação clínica e mapa CRUD

| Recurso | Onde | Fonte |
|---------|------|-------|
| Walk-in particular | `/interno/agenda` → seção walk-in | `AppointmentsView.tsx` |
| Edição cadastros | `/interno/cadastros` → Editar em cada aba | `CadastrosView.tsx` |
| Mapa CRUD (27 entidades) | `/interno/cadastros?tab=operations` | `src/lib/crud-operations-map.ts` |

Detalhe de fluxos: `docs/produto/FLUXOS.md` §4.2, §8.5–8.6 · Demo particular: `pedro.almeida@email.com`.

### Notas não óbvias
- **Prisma 7** quebra o schema atual (remove `url` do datasource e exige driver
  adapters + `prisma.config.ts`). O projeto está **fixado em Prisma 6** de propósito;
  não faça upgrade sem migrar o schema.
- **Middleware virou "Proxy" no Next 16**: a proteção de rotas está em `src/proxy.ts`
  (não existe `middleware.ts`). Ele só faz checagem otimista do cookie; a validação
  real (assinatura HMAC + `role`) acontece no servidor (`src/lib/session.ts`).
- **RBAC interno:** `User.internoProfile` (`ADMIN`, `FATURAMENTO`, `RECEPCAO`, `READONLY`)
  filtra nav e APIs via `interno-permissions.ts` / `interno-guard.ts`.
- `params`/`searchParams`/`cookies()` são **assíncronos** (use `await`).
- ESLint v9 (flat config) trata `react-hooks/set-state-in-effect` como **erro**:
  não chame funções que fazem `setState` de forma síncrona dentro de `useEffect`;
  use uma IIFE assíncrona (padrão já adotado em `BillingView`/`AtendimentoView`).
- SQLite não suporta enums no Prisma; `role`/`status`/`category` são `String`.
- **Netlify:** config em `netlify.toml`; validar pacote com `npm run pre-release` (não publica);
  build CI em `npm run netlify:build`; ver `docs/plataforma/DEPLOY_NETLIFY.md` e `docs/plataforma/WORKFLOW_CURSOR.md`.
  Site pode retornar `503 usage_exceeded` se a cota estiver esgotada — **não** tratar como bug de código.
- **Política de deploy (agentes):** **NUNCA** executar `netlify deploy --prod` nem investigar produção
  em loop, salvo pedido explícito do usuário. Testar com `npm run dev` / `npm run pre-release`.
  Pacotes fechados: `docs/versoes/RELEASES.md` · changelog UI: `docs/plataforma/LANDING_CHANGELOG.md`.
- **Design system / white label:** tokens em `src/app/globals.css`, primitivos em
  `src/components/ui/`, branding por tenant via `TenantBranding` + `TenantTheme`.
  Ver `docs/plataforma/DESIGN_SYSTEM.md`. **Navegação SPA (PR #58):** layouts por portal em
  `src/app/{interno,prestador,pj,beneficiario}/layout.tsx` — shell persistente;
  páginas só renderizam `PageHeader` + conteúdo. Config central: `src/lib/navigation/`.
  Componentes: `Breadcrumbs`, `SectionNav`, `MobileNavDrawer`, `NavigationProgress`.
- **Documentação completa:** [`docs/README.md`](docs/README.md) (índice por segmento), `README.md`, `docs/produto/FLUXOS.md` (fluxos), `docs/produto/JORNADA_CLIENTE.md` (jornada UX nos 4 portais), `docs/produto/AUDITORIA_FLUXOS.md` (falhas mapeadas por portal),
  `docs/plataforma/BENCHMARK.md` (posicionamento vs mercado),
  `docs/plataforma/ARQUITETURA.md`, `docs/plataforma/TESTES.md` (estratégia e mapa de testes automatizados),
  `docs/plataforma/NOTEBOOKLM.md` (RAG), `docs/plataforma/PAYMENTS.md`, `docs/plataforma/COMMUNICATIONS.md`,
  `docs/plataforma/VARIAVEIS_AMBIENTE.md` (mapa de env vars, CI, Netlify e Cursor),
  `docs/plataforma/HISTORICO_2026-06-21.md` (auditoria PRs/deploys), `docs/evidencias/` (capturas dos fluxos).
  `docs/plataforma/ARQUITETURA.md`, `docs/plataforma/NOTEBOOKLM.md` (RAG), `docs/plataforma/PAYMENTS.md`, `docs/plataforma/COMMUNICATIONS.md`,
  `docs/plataforma/HISTORICO_2026-06-21.md` (auditoria PRs/deploys), `docs/plataforma/OPERACOES.md` (mapa de operações),
  `docs/versoes/V2_0.md` (escopo ServiceOS v2.0), `docs/versoes/V2_0_ARCHITECTURE.md` (arquitetura multi-nicho),
  `docs/versoes/RELEASES.md` (pacotes fechados),   `docs/plataforma/WORKFLOW_CURSOR.md` (dev sem deploy),
  `docs/plataforma/LANDING_CHANGELOG.md` (manutenção do bloco Novidades na home),
  `.cursor/rules/operacoes-bibi.mdc` (core), `netlify-release.mdc` (deploy), `stack-nextjs.mdc` (código), `docs/evidencias/` (capturas dos fluxos).
