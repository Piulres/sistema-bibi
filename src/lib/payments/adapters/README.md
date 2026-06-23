# Adapters de pagamento

Implementações concretas dos contratos em `src/lib/payments/`.

## Adapter POC incluído

| Adapter | Env | Descrição |
|---------|-----|-----------|
| **MockPixAdapter** | `PAYMENT_GATEWAY=mock` | Gera QR/copia-e-cola fictícios; confirmação manual via API/UI |

Registrado automaticamente em `src/lib/payments/index.ts` quando `PAYMENT_GATEWAY=mock`.

## Gateways previstos (produção)

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

## Variáveis de ambiente

```env
PAYMENT_GATEWAY=mock          # mock (POC) | asaas | efi | inter
ASAAS_API_KEY=
EFI_CLIENT_ID=
EFI_CLIENT_SECRET=
INTER_CLIENT_ID=
INTER_CLIENT_CERT=
```

## Regras

- **PCI** — nunca trafegar PAN; usar tokenização do gateway (`cardToken`).
- **Pay Per Use** — cobranças referenciam `invoiceId` via `ChargeReference`.
- **Histórico** — persistir em `Payment` (Prisma) após criar cobrança.

Ver fluxos: [`docs/produto/FLUXOS.md`](../../../docs/produto/FLUXOS.md) §4.1 e §7.
