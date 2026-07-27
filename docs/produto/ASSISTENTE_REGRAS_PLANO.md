# Assistente — plano de regras, IA e testes de rotina

Documento mestre da evolução do assistente operacional (Fase 0+). Complementa [`ASSISTENTE_SERVERLESS.md`](ASSISTENTE_SERVERLESS.md).

**Decisões (Renan · jul/2026):**

| # | Decisão |
|---|---------|
| 1 | Painel em **`/interno/assistente`** (módulo `assistente`) |
| 2 | Regras: **template global + override por tenant**; vocabulário por **nicho** |
| 3 | **Fase 0 primeiro:** inventário, matriz de testes, schema, RBAC |
| — | Flag **IA no Tenant.settings** (realm), junto das configs do sistema |
| — | IA usa o **fluxo existente** (regras + tools + confirmação) na tomada de decisão |
| — | **RBAC ADMIN** para painel; revisão RBAC global em paralelo |

---

## Dois modos de operação

| Modo | Ativação | Motor | Custo |
|------|----------|-------|-------|
| **Regras** (padrão) | Sempre (`rulesEnabled: true`) | Gatilhos + condições + tools | Baixo |
| **IA** (add-on) | `Tenant.settings.assistant.aiEnabled` + gateway env | LLM → valida via regras → tools | Tokens |

### Pipeline híbrido (modo IA)

```
Mensagem → contexto (portal, página, nicho, RBAC, sessionState)
         → LLM interpreta intenção
         → motor de regras valida/refina
         → tools → draft → confirm (JTI) → actions
```

A IA **não contorna** RBAC, confirmação serverless nem labels de nicho.

---

## Arquitetura de regras (Fase 2–3)

```mermaid
flowchart LR
  T[AssistantRuleTemplate global]
  N[Override por niche]
  R[Override por tenant opcional]
  E[Rule Engine]
  T --> E
  N --> E
  R --> E
```

| Camada | Igual entre nichos | Varia |
|--------|-------------------|-------|
| Fluxo | draft → confirm → link | — |
| Tools | `create_appointment`, etc. | extras VET/CONSTRUCTION |
| Gatilhos | Estrutura base | Vocabulário (`consulta` / `atendimento` / `sessão`) |
| RAG | Formato snippet | Conteúdo (`niche-knowledge.ts`) |
| Labels | Chaves `useLabels()` | Valores `Tenant.labels` |

---

## Schema — Tenant.settings

```typescript
type TenantSettings = {
  assistant: {
    aiEnabled: boolean;      // add-on IA — default false
    rulesEnabled: boolean;   // motor regras — default true
    ruleOverrides?: TenantRuleOverride[];  // Fase 3 — gatilhos/tools por tenant (runtime v3.0.21+)
  };
};
```

- **Campo Prisma:** `Tenant.settings` (JSON string)
- **Lib:** `src/lib/tenant/settings.ts`
- **Modo efetivo:** `src/lib/assistant/mode.ts` → `resolveAssistantMode(settings)`
- **API:** `GET/PATCH /api/interno/assistant/settings` (módulo `assistente`, write = ADMIN)

---

## RBAC

### Módulo `assistente` (portal Interno)

| Ação | Perfil |
|------|--------|
| Ver `/interno/assistente` | **ADMIN** |
| Editar flag IA / regras / `ruleOverrides` | **ADMIN** |
| Usar chat nos portais | Todos (com tools filtradas por perfil) |

### Revisão RBAC global (paralelo)

| Item | Status | Próximo passo |
|------|--------|---------------|
| APIs internas com `requireInternoModule` | 96/96 ✅ | Manter inventário (`rbac-gaps.test.ts`) |
| `requireInternoModuleWrite` generalizado | Parcial | Fechar ~58 rotas mutáveis |
| Tools assistente × perfil interno | ✅ | Estender quando regras forem configuráveis |
| Confirmação JTI + RBAC | ✅ | Manter no modo IA |

---

## Inventário Fase 0

### Tools por portal

| Portal | Leitura | Draft / escrita |
|--------|---------|-----------------|
| **Interno** | KPIs, agenda, receita, devedores, buscas | user, patient, appointment |
| **Prestador** | agenda, pacientes, extrato | — |
| **PJ** | overview, beneficiários, faturas | — |
| **Beneficiário** | resumo, faturas, slots | book appointment |
| **Shared** | explain_capability (ajuda/RAG) | — |

Fonte canônica: `src/lib/assistant/inventory.ts`

### Cenários de rotina

Catálogo: `src/lib/assistant/scenarios.ts` (70+ cenários)

| Categoria | Exemplos |
|-----------|----------|
| `read` | "Quantos agendamentos hoje?", "Receita de ontem" |
| `help` | "Como faturar?", "Como agendar?" |
| `draft` | Agendamento multi-turno, cadastro |
| `rbac` | READONLY bloqueado em drafts |
| `niche` | VET pet+tutor, LEGAL cliente, CONSTRUCTION |
| `error` | Fallback humanizado |

Testes: `tests/unit/assistant-scenarios.test.ts`, `tests/unit/assistant-routine-matrix.test.ts`

---

## Matriz de testes de rotina

```
Portais:  interno | prestador | pj | beneficiario
Nichos:   MEDICAL | VET | DENTAL | LEGAL | SPA | EDUCATION | CONSTRUCTION
Perfis:   ADMIN | FATURAMENTO | RECEPCAO | READONLY (interno)
Fluxos:   read | help | draft | confirm | rbac | niche | fallback
Modo:     rules | ai (flag tenant + gateway)
```

Helper: `buildRoutineMatrix()` em `inventory.ts`

---

## Fases de entrega

| Fase | Escopo | Status |
|------|--------|--------|
| **0** | Inventário, matriz testes, `Tenant.settings`, RBAC `assistente`, stub `/interno/assistente` | ✅ Este pacote |
| **1** | Flag IA persistida + UI toggle (ADMIN) | ✅ Parcial (API + toggle) |
| **2** | Modelo de regras + engine substituindo/complementando `mock-intents` | ✅ Este pacote |
| **3** | Painel CRUD regras + preview + templates por nicho | ✅ CRUD tenant + preview efetivo |
| **4** | IA híbrida completa (LLM → regras → tools) | ✅ `refineHybridPlan` + allowlist |
| **5** | RBAC write guards generalizados | ⏳ Paralelo |

---

## Arquivos canônicos

| Arquivo | Papel |
|---------|-------|
| `src/lib/assistant/inventory.ts` | Inventário tools + matriz |
| `src/lib/assistant/scenarios.ts` | Cenários de rotina |
| `src/lib/assistant/mode.ts` | Resolução rules vs IA |
| `src/lib/tenant/settings.ts` | Settings do realm |
| `src/app/interno/assistente/page.tsx` | Painel ADMIN |
| `src/app/api/interno/assistant/settings/route.ts` | API config |
| `src/lib/assistant/provider/hybrid.ts` | Fase 4 — validação LLM × regras |
| `src/lib/assistant/runner.ts` | Orquestração chat (modo rules/ai) |
| `docs/produto/ASSISTENTE_SERVERLESS.md` | Arquitetura serverless |

---

## Como validar Fase 0

```bash
npm run db:push          # Tenant.settings
npx vitest run tests/unit/assistant-routine-matrix.test.ts
npx vitest run tests/unit/tenant-settings.test.ts tests/unit/assistant-mode.test.ts
npx vitest run tests/unit/assistant-scenarios.test.ts
npm run lint
```

Manual: login ADMIN interno → `/interno/assistente` → ver inventário e toggle IA (se gateway configurado).
