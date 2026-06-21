# Adapters de pagamento (integração futura)

Este diretório receberá as implementações concretas dos contratos em `src/lib/payments/`.

## Gateways previstos

| Gateway | ID | Documentação |
|---------|-----|--------------|
| Asaas | `asaas` | https://docs.asaas.com/ |
| Efí (Gerencianet) | `efi` | https://dev.efipay.com.br/ |
| Banco Inter | `inter` | https://developers.inter.co/ |

## Contratos a implementar

Cada adapter deve implementar uma ou mais strategies:

- `PixProvider` — `createPixCharge()`
- `BoletoProvider` — `createBoletoCharge()`
- `CardProvider` — `createCardCharge()`

E registrar no singleton:

```typescript
import { paymentGateway } from "@/lib/payments";
import { AsaasPaymentAdapter } from "./asaas-payment-adapter";

paymentGateway.register(new AsaasPaymentAdapter());
```

## Variáveis de ambiente (futuro)

```env
PAYMENT_GATEWAY=asaas
ASAAS_API_KEY=
EFI_CLIENT_ID=
EFI_CLIENT_SECRET=
INTER_CLIENT_ID=
INTER_CLIENT_CERT=
```

## Regras

- **Sem implementação fake** — adapters só entram quando a integração real estiver pronta.
- **PCI** — nunca trafegar PAN; usar tokenização do gateway (`cardToken`).
- **Pay Per Use** — cobranças referenciam `invoiceId` via `ChargeReference`.
