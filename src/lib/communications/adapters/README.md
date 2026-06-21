# Adapters de Comunicação

Implementações concretas dos contratos em `src/lib/communications/`.

## Adapter POC incluído

| Adapter | Env | Canais | Descrição |
|---------|-----|--------|-----------|
| **ConsoleEmailAdapter** | `COMMUNICATION_PROVIDER=console` | EMAIL | Loga e-mail no stdout do servidor |

Registrado automaticamente quando `COMMUNICATION_PROVIDER=console`.

## Provedores previstos (produção)

| Provider | Env | Canais | Documentação |
|----------|-----|--------|--------------|
| **SendGrid** | `COMMUNICATION_PROVIDER=sendgrid` | EMAIL | [SendGrid API](https://docs.sendgrid.com/) |
| **Twilio** | `COMMUNICATION_PROVIDER=twilio` | SMS, WHATSAPP | [Twilio Messaging](https://www.twilio.com/docs/messaging) |
| **Meta** | `COMMUNICATION_PROVIDER=meta` | WHATSAPP | [WhatsApp Business Platform](https://developers.facebook.com/docs/whatsapp) |

## Registro

```typescript
import { communicationGateway } from "@/lib/communications/communication-gateway";
import { sendgridAdapter } from "./sendgrid";

communicationGateway.register(sendgridAdapter);
```

## Variáveis de ambiente

```env
COMMUNICATION_PROVIDER=console   # console (POC) | sendgrid | twilio | meta
SENDGRID_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
META_WHATSAPP_TOKEN=
```
