# Motor de Comunicação — Arquitetura

Documento de referência do **Épico 7** e **Tier 1** (dispatch POC + lembretes automáticos).

---

## Visão geral

```
Operador (Interno) / Cron
        │
        ▼
  message-service.ts         ← fila + CRUD + timeline
  reminder-service.ts        ← lembretes automáticos (Tier 1)
        │
        ├─► Message (SQLite)   status: PENDENTE → ENVIADA | FALHA
        │
        ▼
  notification-service.ts    ← fachada de dispatch
        │
        ▼
  CommunicationGatewayRegistry ← COMMUNICATION_PROVIDER
        │
   ┌────┴────┬──────────────┐
   ▼         ▼              ▼
EmailProvider SmsProvider WhatsAppProvider   (interfaces)
   │         │              │
   └────┬────┴──────────────┘
        ▼
  adapters/
   ├── console-email-adapter.ts  ← POC (COMMUNICATION_PROVIDER=console)
   └── (SendGrid | Twilio | Meta) ← produção futura
```

## Strategy Pattern

| Camada | Arquivo | Responsabilidade |
|--------|---------|------------------|
| Tipos | `types.ts` | Requests, results, enums |
| Contrato base | `notification-provider.ts` | `sendMessage`, `getDeliveryStatus` |
| E-mail | `email-provider.ts` | Transacional |
| SMS | `sms-provider.ts` | Texto curto |
| WhatsApp | `whatsapp-provider.ts` | WhatsApp Business API |
| Registry | `communication-gateway.ts` | Registro e resolução de adapters |
| Fachada | `notification-service.ts` | API interna para dispatch |
| Negócio | `message-service.ts` | Fila, templates, timeline |
| Lembretes | `reminder-service.ts` | Consultas 24h, fatura, assinatura |
| Erros | `errors.ts` | `CommunicationProviderNotConfiguredError` |

## Fluxo (Fila → Dispatch)

1. Operador compõe mensagem no Portal Interno (`/interno/comunicacao`).
2. `queueMessage()` persiste `Message` com status **PENDENTE** e registra `MESSAGE_QUEUED` na Timeline.
3. Operador clica **Despachar** → `dispatchMessage()` chama provider configurado.
4. Com `COMMUNICATION_PROVIDER=console`: e-mail logado no servidor; status **ENVIADA**.
5. Sem adapter: `CommunicationProviderNotConfiguredError`.

## Lembretes automáticos (Tier 1)

| Gatilho | Template | Antecedência |
|---------|----------|--------------|
| Consulta agendada | `APPOINTMENT_REMINDER` | 24 horas |
| Pay Per Use pendente | `INVOICE_DUE` | conforme regra |
| Cobrança de assinatura | `SUBSCRIPTION_DUE` | 3 dias |

**Endpoints:**
- `POST /api/interno/reminders` — dispara lembretes + auto-dispatch (INTERNO)
- `POST /api/cron/reminders` — job agendado (header `x-cron-secret`)

## Templates

| Template | Uso |
|----------|-----|
| `APPOINTMENT_REMINDER` | Lembrete de consulta agendada |
| `INVOICE_DUE` | Procedimentos Pay Per Use pendentes |
| `SUBSCRIPTION_DUE` | Cobrança recorrente pendente |
| `GENERIC` | Texto livre |

## Adapter POC: ConsoleEmailAdapter

Ativo quando `COMMUNICATION_PROVIDER=console`.

- Imprime e-mail no stdout do servidor (dev/demo).
- Permite validar fila, dispatch e timeline sem credenciais externas.
- SMS/WhatsApp ainda exigem adapter real (Twilio/Meta).

## Provedores previstos (produção)

| Provider | Env | Canais |
|----------|-----|--------|
| **SendGrid** | `COMMUNICATION_PROVIDER=sendgrid` | EMAIL |
| **Twilio** | `COMMUNICATION_PROVIDER=twilio` | SMS, WHATSAPP |
| **Meta** | `COMMUNICATION_PROVIDER=meta` | WHATSAPP |

## Variáveis de ambiente

```env
COMMUNICATION_PROVIDER=console   # console | sendgrid | twilio | meta
SENDGRID_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
META_WHATSAPP_TOKEN=
```

## Compatibilidade PostgreSQL

Modelo `Message` usa `String` para enums (SQLite/Postgres). Contratos TypeScript são independentes do ORM.
