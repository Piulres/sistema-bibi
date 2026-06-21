# Adapters de Comunicacao

Implementacoes concretas dos contratos em `src/lib/communications/`.

| Provider | Env | Canais | Documentacao |
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

Nenhum adapter esta incluido nesta POC — o registry lanca `CommunicationProviderNotConfiguredError` ate que um seja registrado.
