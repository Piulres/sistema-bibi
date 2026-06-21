# Motor de Cobrança — Arquitetura

Documento de referência do **Épico 4**. Define contratos Strategy para PIX, boleto e cartão, sem integração ativa.

---

## Visão geral

```
Faturamento (Invoice)
        │
        ▼
  charge-service.ts          ← fachada de negócio
        │
        ▼
  PaymentGatewayRegistry     ← seleciona Strategy
        │
   ┌────┴────┬────────────┐
   ▼         ▼            ▼
PixProvider BoletoProvider CardProvider   (interfaces)
   │         │            │
   └────┬────┴────────────┘
        ▼
  adapters/ (Asaas | Efí | Inter)   ← implementação futura
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
| Erros | `errors.ts` | `PaymentProviderNotConfiguredError` |

## Fluxo futuro (Invoice → Cobrança)

1. Interno emite `Invoice` (Pay Per Use) — **já implementado**.
2. Operador escolhe método (`PIX` | `BOLETO` | `CARD`).
3. `createPixCharge()` / etc. monta `ChargeReference` com `invoiceId`.
4. Adapter do gateway registrado processa e retorna `ChargeRecord`.
5. Timeline registra `CHARGE_SENT` (Épico 2).
6. Webhook do gateway atualiza status → `Invoice.status = PAGA`.

## Gateways previstos

- **Asaas** — `PAYMENT_GATEWAY=asaas`
- **Efí** — `PAYMENT_GATEWAY=efi`
- **Banco Inter** — `PAYMENT_GATEWAY=inter`

Sem adapter registrado, o registry lança `PaymentProviderNotConfiguredError`.

## Compatibilidade PostgreSQL

Contratos são TypeScript puro; entidade `Charge` no banco será introduzida quando a integração for implementada (sem alteração neste épico).
