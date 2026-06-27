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

| Modo | Env | Comportamento |
|------|-----|---------------|
| **mock** (padrão) | `ASSISTANT_PROVIDER` ausente ou `mock` | 350+ gatilhos, extração regex, RAG local |
| **gateway** | `ASSISTANT_PROVIDER=gateway` + `OPENAI_BASE_URL` + `OPENAI_API_KEY` | Netlify AI Gateway / OpenAI-compatible; fallback automático para mock |

Produção hoje usa **mock** — gateway exige secrets no painel Netlify.

## Analytics

Cada tool executada registra evento na timeline (`entityType: Assistant`, ações `ASSISTANT_TOOL_OK` / `ASSISTANT_TOOL_ERR`). Visível em `/interno/auditoria`.

## O que ainda falta (backlog)

| Item | Prioridade | Notas |
|------|------------|-------|
| **Streaming SSE** | Média | Respostas longas do gateway; UX “digitando…” |
| **E2E multi-nicho** | Baixa | VET adicionado; faltam LEGAL, CONSTRUCTION nos E2E |
| **Gateway em produção** | Média | Configurar env vars + `ASSISTANT_PROVIDER=gateway` |
| **Mais tools** | Contínua | Construction (obras), estoque, CRM no assistente |
| **OpenAPI assistente** | Baixa | Documentar `sessionState` no spec |
| **Rate limit / abuse** | Média | Por usuário no chat (hoje só login/MFA) |
| **Tamanho do token** | Baixa | Drafts muito grandes podem exceder limite de body |

## Testes

- `tests/unit/assistant.test.ts` — multi-turno stateless
- `tests/integration/assistant-flow.test.ts` — agendamento com confirmação
- `tests/api/assistant.test.ts` — replay JTI, cancelamento
- `e2e/assistant.spec.ts` — MEDICAL + VET PetCare

## Referências

- `docs/versoes/V2_3.md` — changelog do pacote
- `src/lib/assistant/runner.ts` — orquestração
- `docs/plataforma/VARIAVEIS_AMBIENTE.md` — `ASSISTANT_ENABLED`, `ASSISTANT_PROVIDER`
