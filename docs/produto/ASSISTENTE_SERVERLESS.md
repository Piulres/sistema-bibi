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

| Modo efetivo | Ativação | Comportamento |
|--------------|----------|---------------|
| **Regras** (padrão) | `aiEnabled=false` ou gateway não configurado | Motor de regras (`planMockAssistant`) — 350+ gatilhos, regex, RAG local |
| **IA híbrida** | `Tenant.settings.assistant.aiEnabled` + `OPENAI_BASE_URL` + `OPENAI_API_KEY` | LLM (`planGatewayAssistant`) → validação via regras → tools; fallback para mock em erro |

Resolução em `src/lib/assistant/plan-gateway.ts` → `shouldUseAssistantGateway(mode)`:

1. Modo tenant deve ser `"ai"` (`resolveAssistantMode` em `mode.ts`).
2. `OPENAI_BASE_URL` e `OPENAI_API_KEY` preenchidos (`isGatewayConfigured`).
3. `ASSISTANT_PROVIDER=mock` **força** mock (útil em dev); qualquer outro valor ou ausência usa gateway quando (1)+(2) forem verdade.

> **Hotfix v3.0.20 (#343/#348):** não é mais obrigatório `ASSISTANT_PROVIDER=gateway` — basta ligar IA no tenant com secrets do AI Gateway no Netlify.

Produção hoje usa **mock** (sem secrets OpenAI no painel). Para IA híbrida: configurar env vars + toggle ADMIN em `/interno/assistente`.

### `ruleOverrides` no runtime

Overrides salvos em `Tenant.settings.assistant.ruleOverrides` (CRUD Fase 3 em `/interno/assistente`) **afetam o chat** desde o hotfix v3.0.20:

| Caminho | Uso |
|---------|-----|
| `runner.ts` → `resolvePlan` | Lê overrides do tenant a cada turno |
| `planMockAssistant` / `mock-match` | Gatilhos add/remove e tools desativadas |
| `refineHybridPlan` (modo IA) | Plano de regras paralelo ao LLM para allowlist |

Lib: `src/lib/assistant/rules/tenant-overrides.ts` · API: `GET/PATCH /api/interno/assistant/settings`.

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
| **IA híbrida** | — | ✅ Fase 4 — `refineHybridPlan` (LLM → allowlist regras → tools) |
| **E2E multi-nicho** | Baixa | VET adicionado; faltam LEGAL, CONSTRUCTION nos E2E |
| **Gateway em produção** | Média | Secrets `OPENAI_*` no Netlify + toggle IA no tenant (sem `ASSISTANT_PROVIDER` obrigatório) |
| **Mais tools** | Contínua | Construction (obras), estoque, CRM no assistente |
| **OpenAPI assistente** | Baixa | Documentar `sessionState` no spec |
| **Rate limit / abuse** | Média | Por usuário no chat (hoje só login/MFA) |
| **Tamanho do token** | Baixa | Drafts muito grandes podem exceder limite de body |

## Testes

- `tests/unit/assistant.test.ts` — multi-turno stateless
- `tests/unit/assistant-hybrid.test.ts` — pipeline híbrido, `shouldUseAssistantGateway`, overrides no runtime
- `tests/integration/assistant-flow.test.ts` — agendamento com confirmação
- `tests/api/assistant.test.ts` — replay JTI, cancelamento
- `e2e/assistant.spec.ts` — MEDICAL + VET PetCare

## Referências

- `docs/versoes/V2_3.md` — changelog do pacote
- `src/lib/assistant/runner.ts` — orquestração
- `docs/plataforma/VARIAVEIS_AMBIENTE.md` — `ASSISTANT_ENABLED`, `ASSISTANT_PROVIDER`
