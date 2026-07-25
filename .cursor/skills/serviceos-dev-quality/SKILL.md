---
name: serviceos-dev-quality
description: >-
  Fluxo obrigatório de qualidade para qualquer feature, bugfix, refatoração
  ou skill nova no Sistema Bibi - ServiceOS. Use em implementação de lógica,
  correção de erros, testes unitários, limpeza de código, análise de desempenho,
  design patterns, integração com APIs e algoritmos. Aplique em todo trabalho
  de código neste repositório.
---

# ServiceOS — skill de qualidade para agentes

Atue como engenheiro sênior no **Sistema Bibi - ServiceOS** (Next.js 16, React 19, Prisma 6, Vitest, Playwright).

Leia primeiro (nesta ordem, só o necessário):

1. `AGENTS.md`
2. `docs/prompts/SERVICEOS_V2_IMPLEMENTATION.md`
3. `.cursor/rules/operacoes-bibi.mdc` (branches, lint, proibido deploy)
4. Domínio tocado (ex.: `docs/clientes/cedig/`, `docs/segmentos/`, `docs/plataforma/`)

Checklist resumido: [references/CHECKLIST.md](references/CHECKLIST.md)

---

## Quando usar

- Nova funcionalidade / “skill” de produto
- Bugfix ou “identifique e corrija os erros”
- Pedido de testes unitários / e2e
- Refatoração (“mais limpo, eficiente, legível”)
- Análise de desempenho / escalabilidade / organização
- Integração com API interna (`/api/...`) ou adapter externo

---

## Fluxo obrigatório (5 passos)

### 1) Diagnosticar antes de codificar

- Reproduza o sintoma (teste, curl local, UI).
- Localize causa raiz (não só o sintoma).
- Explique em 2–4 frases: **o que quebrava**, **por quê**, **o que corrige**.
- Escopo mínimo: não refatore arquivos não relacionados.

### 2) Implementar com padrões do projeto

Escolha o padrão que já existe no repo (não invente framework):

| Situação | Padrão / local canônico |
|----------|-------------------------|
| Precificação / tabelas | Funções puras em `src/lib/...` + testes Vitest |
| Auth / RBAC | `requireInternoModule` / `requireInternoModuleWrite` / `api-auth.ts` |
| UI autenticada | `useLabels()` · `PortalShell` · pages só `PageHeader` + view |
| Persistência | Prisma 6 em `service`/`route` — sem Prisma 7 |
| Segmento | `?tenant=` · `bibi_segment` · `src/lib/segment/` |
| Export | `TabularExport` + `serveTabularExport` |
| Pagamentos | adapters em `src/lib/payments/` (`PAYMENT_GATEWAY=mock`) |

Algoritmos: prefira complexidade clara (O(n) / O(n log n)); evite N+1 Prisma — use `include`/`select` e batch.

### 3) Qualidade do código

Ao escrever ou reescrever:

- Nomes explícitos; funções pequenas; early return.
- Comentários só onde a intenção não é óbvia (ponte de domínio, invariante de negócio).
- Sem `any` desnecessário; tipar inputs/outputs públicos.
- Respeitar ESLint (`react-hooks/set-state-in-effect` = IIFE async, não `setState` síncrono no effect).
- **Nunca** hardcodar “Paciente/Consulta/Beneficiário” em portais — use `useLabels()` / `getTenantLabelsById`.

### 4) Testes (obrigatório para lógica nova)

| Tipo | Onde | Quando |
|------|------|--------|
| Unitário puro | `tests/unit/*.test.ts` | Helpers, pricing, mappers, RBAC |
| Integração DB | `tests/unit/*-integration.test.ts` | Serviços que usam Prisma (massa seed) |
| API / fluxo | `tests/api/` ou e2e | Contratos críticos |
| E2E | `e2e/*.spec.ts` | Jornada multi-portal / piloto cliente |

Rodar o mínimo relevante:

```bash
npm run lint
npx vitest run path/to/test.ts
npm run docs:verify   # se mexeu em docs/version/changelog
```

Não inventar Jest — o projeto usa **Vitest**. E2E = **Playwright**.

### 5) Integração, docs e entrega

- API route: auth + validação + status HTTP coerentes; erros com mensagem útil.
- Documentar parâmetros/retorno em JSDoc da função pública ou em `docs/` do domínio.
- Branch `cursor/<nome>-5f67` → PR → **`dev`** (nunca `main` direto).
- **Proibido** sem pedido explícito: `netlify deploy`, `db:reset`, loops em produção.
- Validar local: `npm run dev` / smoke do fluxo; `pre-release` só ao fechar pacote.

---

## Prompt-mestre (copie mentalmente em cada feature)

> Atue como desenvolvedor especialista em TypeScript/Next.js neste repo ServiceOS.  
> Implemente **[feature]** de forma modular (padrão já usado no projeto), com algoritmo eficiente onde houver processamento, integração segura às rotas/APIs internas, documentação clara e testes Vitest.  
> Explique causa raiz se for bugfix. Não altere deploy/infra. Use `useLabels()` em UI autenticada. PR para `dev`.

---

## Anti-patterns

| Evitar | Fazer |
|--------|-------|
| HealthOS / só-saúde em copy nova | ServiceOS + segmento (`MEDICAL`, …) |
| Refatoração cosmética sem teste | Teste que trava a regressão |
| Novo framework de state/DI | Seguir `service` + route + view |
| Deploy “para validar” | Validar local / `pre-release` |
| Duplicar docs longos no chat | Referenciar `docs/` |

---

## Saída esperada no PR / handoff

1. O que mudou (1 parágrafo)  
2. Causa raiz (se bug)  
3. Como validar (comandos + fluxo)  
4. Riscos / fora de escopo  
