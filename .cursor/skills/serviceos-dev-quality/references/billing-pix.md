# Faturamento e PIX

## Código

- Adapters: `src/lib/payments/` (`PAYMENT_GATEWAY=mock`)
- UI faturamento interno: módulo interno com RBAC `FATURAMENTO`
- Guia TISS: `src/lib/tiss-service.ts` · `GET /api/interno/invoices/[id]/tiss`
- Docs: `docs/plataforma/PAYMENTS.md` · fluxo TISS: `docs/produto/FLUXOS.md` §4.1

## Padrão

- Adapter mock por padrão — não integrar gateway real sem pedido
- Export tabular: `TabularExport` + `serveTabularExport`
- Auth: `requireInternoModule` nas rotas de escrita
- TISS: fatura sem itens ou beneficiário sem documento → **422** `TissBuildError` (`NO_ITEMS` / `NO_PATIENT_DOCUMENT`)

## AGENTS aninhado

- `src/lib/payments/AGENTS.md`
