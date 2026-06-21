# Motor de Comunicação — Arquitetura

Documento de referência do **Épico 7**. Define contratos Strategy para e-mail, SMS e WhatsApp, com fila interna de mensagens e sem integração ativa.

---

## Visão geral

```
Operador (Interno)
        │
        ▼
  message-service.ts         ← fila + CRUD + timeline
        │
        ├─► Message (SQLite)   status: PENDENTE → ENVIADA | FALHA
        │
        ▼
  notification-service.ts    ← fachada de dispatch
        │
        ▼
  CommunicationGatewayRegistry ← seleciona Strategy
        │
   ┌────┴────┬──────────────┐
   ▼         ▼              ▼
EmailProvider SmsProvider WhatsAppProvider   (interfaces)
   │         │              │
   └────┬────┴──────────────┘
        ▼
  adapters/ (SendGrid | Twilio | Meta)   ← implementação futura
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
| Erros | `errors.ts` | `CommunicationProviderNotConfiguredError` |

## Fluxo (Fila → Dispatch)

1. Operador compõe mensagem no Portal Interno (`/interno/comunicacao`).
2. `queueMessage()` persiste `Message` com status **PENDENTE** e registra `MESSAGE_QUEUED` na Timeline.
3. Operador clica **Despachar** → `dispatchMessage()` chama `sendEmail()` / `sendSms()` / `sendWhatsApp()`.
4. Com adapter registrado: status **ENVIADA**, `externalId`, `MESSAGE_SENT`.
5. Sem adapter: retorna erro explícito (nenhuma implementação fake).

## Templates previstos

| Template | Uso |
|----------|-----|
| `APPOINTMENT_REMINDER` | Lembrete de consulta agendada |
| `INVOICE_DUE` | Procedimentos Pay Per Use pendentes |
| `SUBSCRIPTION_DUE` | Cobrança recorrente pendente |
| `GENERIC` | Texto livre |

## Provedores previstos

- **SendGrid** — `COMMUNICATION_PROVIDER=sendgrid` (e-mail)
- **Twilio** — `COMMUNICATION_PROVIDER=twilio` (SMS + WhatsApp)
- **Meta** — `COMMUNICATION_PROVIDER=meta` (WhatsApp Business)

Sem adapter registrado, o registry lança `CommunicationProviderNotConfiguredError`.

## Compatibilidade PostgreSQL

Modelo `Message` usa `String` para enums (SQLite/Postgres). Contratos TypeScript são independentes do ORM.
