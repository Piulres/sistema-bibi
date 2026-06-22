# Motor de Cobrança — Arquitetura

Documento de referência do **Épico 4** e **Tier 1** (ciclo de receita implementado na POC).

---

## Visão geral

```
Faturamento (Invoice)
        │
        ▼
  invoice-service.ts         ← PIX, marcar PAGA, bridge assinatura (Tier 1)
        │
        ▼
  charge-service.ts          ← fachada de negócio (Strategy)
        │
        ▼
  PaymentGatewayRegistry     ← seleciona adapter por PAYMENT_GATEWAY
        │
   ┌────┴────┬────────────┐
   ▼         ▼            ▼
PixProvider BoletoProvider CardProvider   (interfaces)
   │         │            │
   └────┬────┴────────────┘
        ▼
  adapters/
   ├── mock-pix-adapter.ts   ← POC (PAYMENT_GATEWAY=mock)
   └── (Asaas | Efí | Inter) ← produção futura
        │
        ▼
  Payment (Prisma)           ← histórico PIX/manual por fatura
```

## Strategy Pattern

| Camada | Arquivo | Responsabilidade |
|--------|---------|------------------|
| Tipos | `types.ts` | Requests, results, enums |
| Contrato base | `payment-provider.ts` | `createCharge`, `getCharge`, `cancelCharge` |
| PIX | `pix-provider.ts` | QR Code + copia-e-cola |
| Boleto | `boleto-provider.ts` | Linha digitável + PDF |
| Cartão | `card-provider.ts` | Token + parcelas |
| Registry | `payment-gateway.ts` | Registro e resolução de adapters |
| Fachada | `charge-service.ts` | API interna para módulos de negócio |
| Negócio | `invoice-service.ts` | PIX, confirmar pagamento, marcar PAGA, bridge assinatura |
| Erros | `errors.ts` | `PaymentProviderNotConfiguredError` |

## Fluxo implementado (Tier 1)

1. Interno emite `Invoice` (Pay Per Use ou bridge de `SubscriptionCharge`).
2. Operador ou beneficiário solicita **PIX** → `createPixCharge()` via `MockPixAdapter`.
3. Sistema persiste `Payment` com status `PENDING`, `pixCopyPaste` e `qrCodePayload`.
4. Confirmação (interno ou beneficiário) → `Payment.status = CONFIRMED`, `Invoice.status = PAGA`.
5. Timeline registra `INVOICE_PAID` e, quando aplicável, `CHARGE_SENT`.

### Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/interno/invoices/{id}/pix` | Gera cobrança PIX |
| `POST` | `/api/interno/invoices/{id}/confirm-pix` | Confirma PIX pendente |
| `POST` | `/api/interno/invoices/{id}/pay` | Marca fatura PAGA (manual) |
| `POST` | `/api/beneficiario/invoices/{id}/pay` | Gera PIX (beneficiário) |
| `PATCH` | `/api/beneficiario/invoices/{id}/pay` | Confirma PIX (beneficiário) |
| `POST` | `/api/interno/subscriptions/charges/{chargeId}/invoice` | Cobrança → fatura |

### UI — QR PIX mock (beneficiário)

Componente `PixQrDisplay` (`src/components/ui/PixQrDisplay.tsx`):

- Renderizado em `BeneficiarioView` após `POST …/invoices/[id]/pay`
- Grade visual 7×7 derivada do `pixCopyPaste` (decorativa, não é QR EMV real)
- Botão “Copiar código” com feedback “Copiado!”
- Usa `qrCodePayload` do adapter mock apenas no backend; a UI exibe o copia-e-cola

## Adapter POC: MockPixAdapter

Ativo quando `PAYMENT_GATEWAY=mock` (padrão em `.env.example`).

- Gera QR/copia-e-cola fictícios para demonstração.
- Não chama gateway externo; confirmação é manual via API ou UI.
- Registrado automaticamente em `src/lib/payments/index.ts`.

## Gateways previstos (produção)

| Gateway | Env | Documentação |
|---------|-----|--------------|
| **Asaas** | `PAYMENT_GATEWAY=asaas` | https://docs.asaas.com/ |
| **Efí** | `PAYMENT_GATEWAY=efi` | https://dev.efipay.com.br/ |
| **Banco Inter** | `PAYMENT_GATEWAY=inter` | https://developers.inter.co/ |

Sem adapter registrado para o gateway escolhido, o registry lança `PaymentProviderNotConfiguredError`.

## Variáveis de ambiente

```env
PAYMENT_GATEWAY=mock          # mock | asaas | efi | inter
ASAAS_API_KEY=
EFI_CLIENT_ID=
EFI_CLIENT_SECRET=
INTER_CLIENT_ID=
INTER_CLIENT_CERT=
```

## Modelo `Payment`

| Campo | Descrição |
|-------|-----------|
| `method` | `PIX`, `MANUAL`, etc. |
| `status` | `PENDING`, `CONFIRMED`, `FAILED`, `CANCELLED` |
| `pixCopyPaste` / `qrCodePayload` | Dados PIX mock ou reais |
| `externalId` | ID no gateway (quando integrado) |

## Compatibilidade PostgreSQL

Entidade `Payment` e contratos TypeScript são compatíveis com migração para Postgres (Netlify Database).

---

## Ver também

- [`FLUXOS.md`](FLUXOS.md) — seções 4.1 (faturamento interno), 6 (PIX beneficiário) e 7 (Pay Per Use E2E)
- [`ARQUITETURA.md`](ARQUITETURA.md) — Épico 4 e Tier 1
