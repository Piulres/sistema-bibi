---
name: serviceos-dev-quality
description: >-
  Fluxo obrigatório de qualidade para feature, bugfix, refatoração ou testes
  no Sistema Bibi - ServiceOS. Router para references por domínio (CRUD,
  CEDIG, PIX, auth tenant, release). Use /serviceos-dev-quality em todo
  trabalho de código neste repositório.
---

# ServiceOS — skill de qualidade

Atue como engenheiro sênior no **Sistema Bibi - ServiceOS** (Next.js 16, React 19, Prisma 6, Vitest, Playwright).

## Leitura inicial (só o necessário)

1. `AGENTS.md` (índice)
2. `docs/prompts/SERVICEOS_V2_IMPLEMENTATION.md` (features novas)
3. Domínio tocado — tabela abaixo

Checklist: [references/CHECKLIST.md](references/CHECKLIST.md)

## References por domínio

| Domínio | Reference |
|---------|-----------|
| CRUD / entidade nova | [crud-entity.md](references/crud-entity.md) |
| CEDIG / gestão clínica | [cedig-clinic.md](references/cedig-clinic.md) |
| PIX / faturamento | [billing-pix.md](references/billing-pix.md) |
| Login tenant/portal | [auth-tenant.md](references/auth-tenant.md) |
| Fechar pacote | [release-package.md](references/release-package.md) |

## Fluxo (5 passos)

### 1) Diagnosticar

Reproduza → causa raiz → explique em 2–4 frases → escopo mínimo.

### 2) Implementar (padrões do repo)

| Situação | Local |
|----------|-------|
| Lógica pura | `src/lib/...` + Vitest |
| Auth / RBAC | `requireInternoModule` / `api-auth.ts` |
| UI autenticada | `useLabels()` · `PortalShell` · `PageHeader` + view |
| Persistência | Prisma 6 — sem v7 |
| Segmento | `?tenant=` · `bibi_segment` · `src/lib/segment/` |

Rules escopadas: `.cursor/rules/stack-nextjs.mdc` · `serviceos-dev.mdc` · `tests.mdc`

### 3) Qualidade

Early return · sem `any` desnecessário · ESLint (`set-state-in-effect` = IIFE async) · **nunca** hardcodar labels de nicho.

### 4) Testes

Vitest (não Jest) · E2E Playwright · CRUD → ver [crud-entity.md](references/crud-entity.md)

```bash
npm run lint
npx vitest run path/to/test.ts
npm run docs:verify   # se versão/changelog/docs
```

### 5) Entrega

- Branch `cursor/<nome>-<suffix>` → PR → **`dev`**
- Proibido sem pedido: `netlify deploy`, `db:reset`, loops produção
- Handoff: o que mudou · causa raiz · como validar · riscos

## Anti-patterns

| Evitar | Fazer |
|--------|-------|
| HealthOS em copy nova | ServiceOS + segmento |
| Refatoração sem teste | Teste de regressão |
| Deploy para validar | `npm run dev` / `pre-release` |
| Duplicar docs no chat | Referenciar `docs/` |
