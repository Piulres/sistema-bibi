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
| **mock** (padrão) | `ASSISTANT_PROVIDER` ausente ou `mock` | Gatilhos resolvidos por `resolveAssistantIntents` (global + nicho + tenant), extração regex, RAG local |
| **gateway** | `ASSISTANT_PROVIDER=gateway` + `OPENAI_BASE_URL` + `OPENAI_API_KEY` | Netlify AI Gateway / OpenAI-compatible; fallback automático para mock |

Produção hoje usa **mock** — gateway exige secrets no painel Netlify.

## Motor de regras (v3.0.18)

O provider mock não lê `MOCK_INTENTS` diretamente. Cada turno chama `resolveAssistantIntents(user)` em `mock-match.ts`, que mescla:

1. Templates globais (`rules/templates.ts` ← `mock-intents.ts`)
2. Overrides de vocabulário por nicho (`rules/niche-overrides.ts`)
3. Overrides por tenant em `Tenant.settings.assistant.ruleOverrides`

O resultado é convertido para `MockIntentDef[]` e segue o fluxo existente (match → draft → confirm). Desativar regras (`rulesEnabled=false`) bloqueia o chat operacional; IA continua disponível se `aiEnabled=true` e gateway configurado.

Detalhes, schema e validação: [`ASSISTENTE_REGRAS_PLANO.md`](ASSISTENTE_REGRAS_PLANO.md) · testes: `tests/unit/assistant-rule-engine.test.ts`.

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
| **Painel CRUD regras** | Alta | UI para `ruleOverrides` em `/interno/assistente` — motor já em produção (Fase 2) |
| **E2E multi-nicho** | Baixa | VET adicionado; faltam LEGAL, CONSTRUCTION nos E2E |
| **Gateway em produção** | Média | Configurar env vars + `ASSISTANT_PROVIDER=gateway` |
| **Mais tools** | Contínua | Construction (obras), estoque, CRM no assistente |
| **OpenAPI assistente** | Baixa | Documentar `sessionState` no spec |
| **Rate limit / abuse** | Média | Por usuário no chat (hoje só login/MFA) |
| **Tamanho do token** | Baixa | Drafts muito grandes podem exceder limite de body |

## Testes

- `tests/unit/assistant.test.ts` — multi-turno stateless
- `tests/unit/assistant-rule-engine.test.ts` — merge global/nicho/tenant
- `tests/integration/assistant-flow.test.ts` — agendamento com confirmação
- `tests/api/assistant.test.ts` — replay JTI, cancelamento
- `e2e/assistant.spec.ts` — MEDICAL + VET PetCare

## Referências

- `docs/versoes/V2_3.md` — changelog do pacote
- `src/lib/assistant/runner.ts` — orquestração
- `docs/plataforma/VARIAVEIS_AMBIENTE.md` — `ASSISTANT_ENABLED`, `ASSISTANT_PROVIDER`
