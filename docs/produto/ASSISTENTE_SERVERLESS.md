# Assistente operacional — arquitetura serverless

Documentação do modelo **stateless** do chat nos 4 portais (`/api/assistant/chat`, `/api/assistant/confirm`).

## Problema em serverless (Netlify)

Funções serverless **não compartilham memória** entre requisições. O assistente v2.1 usava `Map` em memória para:

| Estado | Arquivo legado | Sintoma em produção |
|--------|----------------|---------------------|
| `pendingActionId` (UUID) | `pending-actions.ts` | Confirmação retorna 410 — ação “expirada” |
| Draft multi-turno | `mock-context.ts` | Assistente “esquece” dados entre mensagens |
| Última intent | `mock-context.ts` | Follow-up (“e amanhã?”) quebra |

## Solução v2.3 — tokens HMAC no cliente

```
Cliente                          API (serverless)
   │                                    │
   │  POST /chat + sessionState         │
   │ ─────────────────────────────────► │ decode sessionState (HMAC)
   │                                    │ restaura draft em memória (só esta req)
   │                                    │ executa tools
   │  ◄──────────────────────────────── │ sessionState novo + pendingActionId assinado
   │                                    │
   │  POST /confirm + pendingActionId   │
   │ ─────────────────────────────────► │ verifica HMAC + JTI one-time (Blobs)
   │                                    │ executa ação no Prisma
```

### Componentes

| Módulo | Função |
|--------|--------|
| `session-state.ts` | `encode/decodeAssistantSessionState` — draft, choice, lastIntent (TTL 15 min) |
| `session-state.ts` | `encode/decodePendingEnvelope` — payload da ação (TTL 10 min) + **JTI** |
| `pending-consumed.ts` | Marca JTI como consumido (Netlify Blobs + fallback memória em dev) |
| `AssistantProvider.tsx` | Persiste e reenvia `sessionState` a cada turno |
| `mock-context.ts` | Maps **por requisição** — populados via `applyMockContext` no início do turno |

### Segurança dos tokens

- Assinatura **HMAC-SHA256** com `SESSION_SECRET`
- `userId` + `tenantId` embutidos — token de outro usuário/tenant é rejeitado
- `timingSafeEqual` na verificação da assinatura
- **JTI one-time** na confirmação — replay do mesmo `pendingActionId` retorna 410

## Provider de IA

| Modo | Ativação | Comportamento |
|------|----------|---------------|
| **Regras** (padrão) | `Tenant.settings.assistant.aiEnabled=false` ou gateway ausente | Gatilhos + `ruleOverrides` + extração regex |
| **IA híbrida** | `aiEnabled=true` + `OPENAI_BASE_URL` + `OPENAI_API_KEY` + `ASSISTANT_PROVIDER≠mock` | LLM propõe → `refineHybridPlan` valida → tools |

Produção hoje usa **regras** — gateway exige secrets no painel Netlify **e** toggle IA no tenant (`/interno/assistente`).

### Pipeline híbrido (Fase 4)

```
Mensagem → resolveAssistantMode(tenant)
         → gateway: planGatewayAssistant (LLM)
         → regras: planMockAssistant (+ ruleOverrides do tenant)
         → refineHybridPlan (allowlist tools ∩ RBAC)
         → executa tools → draft → confirm (JTI) → actions
```

| Etapa | Módulo | Regra |
|-------|--------|-------|
| Modo efetivo | `mode.ts` | IA só com `aiEnabled` **e** `OPENAI_*` configurados |
| Gateway ativo? | `plan-gateway.ts` | `ASSISTANT_PROVIDER=mock` força regras mesmo com env |
| Allowlist | `hybrid.ts` → `collectAllowedToolNames` | Interseção tools RBAC × motor de regras |
| Refino | `hybrid.ts` → `refineHybridPlan` | Descarta tools fora do allowlist; mescla args (gateway prevalece) |
| Fallback | `hybrid.ts` | Se LLM não propõe tool válida → plano de regras → texto |

**`ruleOverrides` (Fase 3 → runtime v3.0.21):** overrides por tool (`addTriggers`, `removeTriggers`, `disabled`) persistidos em `Tenant.settings.assistant.ruleOverrides` e aplicados em **ambos** os modos via `resolveAssistantIntents` / `planMockAssistant` (`runner.ts`). O painel ADMIN em `/interno/assistente` edita via `PATCH /api/interno/assistant/settings`.

| Modo | Env | Comportamento legado |
|------|-----|---------------------|
| **mock** (padrão dev) | `ASSISTANT_PROVIDER` ausente ou `mock` | 350+ gatilhos, extração regex, RAG local |
| **gateway** | `ASSISTANT_PROVIDER=gateway` ou `netlify-gateway` + `OPENAI_*` | Netlify AI Gateway / OpenAI-compatible; fallback para regras se LLM falhar |

Detalhes de env vars: [`VARIAVEIS_AMBIENTE.md`](../plataforma/VARIAVEIS_AMBIENTE.md) §Assistente operacional.

## UX do painel (v3.0.6)

O assistente é um drawer fixo à direita (`AssistantPanel`). Fechamento automático evita sobrepor a tela de destino após navegação.

| Gatilho | Implementação |
|---------|---------------|
| Clique em ação `link` ou `form_draft` | `AssistantActionCard` → `closeOnNavigate()` → `setOpen(false)` |
| Mudança de rota enquanto aberto | `AssistantPanel` compara `pathname` com o valor ao abrir; divergência → `setOpen(false)` |
| Escape / backdrop / botão ✕ | Handlers explícitos em `AssistantPanel` |

Ações `confirm` e `choice` **não** fecham o painel — o usuário confirma ou escolhe in-place. Testes E2E do assistente: `e2e/assistant.spec.ts` (MEDICAL + VET).

## Analytics

Cada tool executada registra evento na timeline (`entityType: Assistant`, ações `ASSISTANT_TOOL_OK` / `ASSISTANT_TOOL_ERR`). Visível em `/interno/auditoria`.

## O que ainda falta (backlog)

| Item | Prioridade | Notas |
|------|------------|-------|
| **Streaming SSE** | Média | Respostas longas do gateway; UX “digitando…” |
| **Painel de regras** | — | ✅ Fase 3 — CRUD + preview em `/interno/assistente` |
| **IA híbrida** | — | ✅ Fase 4 — `refineHybridPlan` + allowlist + `ruleOverrides` no runtime |
| **E2E multi-nicho** | Baixa | VET adicionado; faltam LEGAL, CONSTRUCTION nos E2E |
| **Gateway em produção** | Média | `aiEnabled` no tenant + env vars + `ASSISTANT_PROVIDER=netlify-gateway` |
| **Mais tools** | Contínua | Construction (obras), estoque, CRM no assistente |
| **OpenAPI assistente** | Baixa | Documentar `sessionState` no spec |
| **Rate limit / abuse** | Média | Por usuário no chat (hoje só login/MFA) |
| **Tamanho do token** | Baixa | Drafts muito grandes podem exceder limite de body |

## Testes

- `tests/unit/assistant.test.ts` — multi-turno stateless
- `tests/unit/assistant-hybrid.test.ts` — `refineHybridPlan`, allowlist, merge de args
- `tests/integration/assistant-flow.test.ts` — agendamento com confirmação
- `tests/api/assistant.test.ts` — replay JTI, cancelamento
- `e2e/assistant.spec.ts` — MEDICAL + VET PetCare

## Referências

- `docs/versoes/V2_3.md` — changelog do pacote stateless
- `docs/produto/ASSISTENTE_REGRAS_PLANO.md` — fases, schema, RBAC
- `src/lib/assistant/runner.ts` — orquestração (rules vs IA híbrida)
- `src/lib/assistant/provider/hybrid.ts` — validação LLM × regras
- `docs/plataforma/VARIAVEIS_AMBIENTE.md` — `ASSISTANT_*`, `OPENAI_*`
