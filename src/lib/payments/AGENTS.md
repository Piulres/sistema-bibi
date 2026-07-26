# Pagamentos — contexto para agentes

**Adapter padrão:** mock (`PAYMENT_GATEWAY=mock` no `.env`)

## Estrutura

- Adapters: `src/lib/payments/`
- Docs: `docs/plataforma/PAYMENTS.md`

## Regras

- Não integrar gateway real sem pedido explícito
- Rotas internas: RBAC `FATURAMENTO` ou `ADMIN`
- Export: `TabularExport` + `serveTabularExport`
- TISS: `src/lib/tiss-service.ts` — 422 se fatura sem itens ou beneficiário sem documento

Skill reference: `.cursor/skills/serviceos-dev-quality/references/billing-pix.md`
