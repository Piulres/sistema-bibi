# Faturamento e PIX

## Código

- Adapters: `src/lib/payments/` (`PAYMENT_GATEWAY=mock`)
- UI faturamento interno: módulo interno com RBAC `FATURAMENTO`
- Docs: `docs/plataforma/PAYMENTS.md`

## Padrão

- Adapter mock por padrão — não integrar gateway real sem pedido
- Export tabular: `TabularExport` + `serveTabularExport`
- Auth: `requireInternoModule` nas rotas de escrita

## AGENTS aninhado

- `src/lib/payments/AGENTS.md`
