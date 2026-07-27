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
    ruleOverrides?: TenantRuleOverride[];  // Fase 2 parse · Fase 3 UI/API
  };
};

type TenantRuleOverride = {
  tool: string;
  addTriggers?: string[];
  removeTriggers?: string[];
  disabled?: boolean;
};
```

- **Campo Prisma:** `Tenant.settings` (JSON string)
- **Lib:** `src/lib/tenant/settings.ts` · parser de overrides: `src/lib/assistant/rules/tenant-overrides.ts`
- **Modo efetivo:** `src/lib/assistant/mode.ts` → `resolveAssistantMode(settings)`
- **API:** `GET/PATCH /api/interno/assistant/settings` (módulo `assistente`, write = ADMIN)

---

## Motor de regras — Fase 2 (v3.0.18)

O catálogo legado `MOCK_INTENTS` virou **templates globais** resolvidos em camadas antes do `mock-match`.

### Fluxo em runtime

```
POST /api/assistant/chat
  → runner.ts (rulesEnabled? mode ai?)
  → planMockAssistant → mock-match.ts
  → resolveAssistantIntents(user)     // niche do SessionUser
  → resolveAssistantRules({ niche })
  → rulesToMockIntents → match de gatilhos + tools
```

### Merge de camadas (`resolve.ts`)

| Ordem | Fonte | Arquivo | Efeito |
|-------|-------|---------|--------|
| 1 | Global | `rules/templates.ts` ← `MOCK_INTENTS` | Base de tools/gatilhos/roles |
| 2 | Nicho | `rules/niche-overrides.ts` | Acrescenta vocabulário do segmento (ex.: VET: `pet`, `banho`) |
| 3 | Tenant | `Tenant.settings.assistant.ruleOverrides` | `addTriggers` / `removeTriggers` / `disabled` por tool |

Normalização de gatilhos: lowercase + NFD (acentos removidos) — `"audiência"` e `"audiencia"` colidem.

### O que já funciona vs. Fase 3

| Capacidade | Status v3.0.18 |
|------------|----------------|
| Templates globais + merge por nicho | ✅ em todo chat mock |
| Toggle `rulesEnabled` (desliga motor) | ✅ painel + runner |
| Estatísticas no painel (`globalRules`, `nicheRules`, `totalTriggers`) | ✅ `GET /api/interno/assistant/settings` |
| Overrides por tenant em runtime | ⏳ parser + testes; **mock-match ainda não carrega** `ruleOverrides` do tenant |
| CRUD de regras no painel | ⏳ Fase 3 |

### Painel `/interno/assistente`

`AssistenteConfigView` exibe modo efetivo, toggles `aiEnabled`/`rulesEnabled`, inventário de tools/cenários e card **Motor de regras** com contagem por camada.

### Como validar Fase 2

```bash
npx vitest run tests/unit/assistant-rule-engine.test.ts
npx vitest run tests/unit/assistant-routine-matrix.test.ts
npx vitest run tests/api/interno-assistant-settings.test.ts
npm run lint
```

Manual: login ADMIN → `/interno/assistente` → conferir estatísticas; no chat VET, `"quantos pets hoje?"` deve acionar `count_appointments`.

---

## RBAC

### Módulo `assistente` (portal Interno)

| Ação | Perfil |
|------|--------|
| Ver `/interno/assistente` | **ADMIN** |
| Editar flag IA / regras (futuro) | **ADMIN** |
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
| **2** | Modelo de regras + engine substituindo/complementando `mock-intents` | ✅ v3.0.18 — merge global/nicho/tenant (tenant em runtime = Fase 3) |
| **3** | Painel CRUD regras + preview + templates por nicho | ⏳ Parcial (stats + toggle regras; sem CRUD de overrides) |
| **4** | IA híbrida completa (LLM → regras → tools) | ⏳ |
| **5** | RBAC write guards generalizados | ⏳ Paralelo |

---

## Arquivos canônicos

| Arquivo | Papel |
|---------|-------|
| `src/lib/assistant/inventory.ts` | Inventário tools + matriz |
| `src/lib/assistant/scenarios.ts` | Cenários de rotina |
| `src/lib/assistant/mode.ts` | Resolução rules vs IA |
| `src/lib/assistant/rules/engine.ts` | `resolveAssistantIntents` + stats do painel |
| `src/lib/assistant/rules/resolve.ts` | Merge global → nicho → tenant |
| `src/lib/assistant/rules/templates.ts` | `MOCK_INTENTS` → regras globais |
| `src/lib/assistant/rules/niche-overrides.ts` | Vocabulário por segmento |
| `src/lib/assistant/rules/tenant-overrides.ts` | Parser de `ruleOverrides` |
| `src/lib/assistant/provider/mock-match.ts` | Match de gatilhos em runtime |
| `src/lib/tenant/settings.ts` | Settings do realm |
| `src/app/interno/assistente/page.tsx` | Painel ADMIN |
| `src/app/api/interno/assistant/settings/route.ts` | API config + stats |
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
