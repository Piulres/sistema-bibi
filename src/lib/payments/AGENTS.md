# Pagamentos — contexto para agentes

**Adapter padrão:** mock (`PAYMENT_GATEWAY=mock` no `.env`)

## Estrutura

- Adapters: `src/lib/payments/`
- Docs: `docs/plataforma/PAYMENTS.md`

## Regras

- Não integrar gateway real sem pedido explícito
- Rotas internas: RBAC `FATURAMENTO` ou `ADMIN`
- Export: `TabularExport` + `serveTabularExport`

Skill reference: `.cursor/skills/serviceos-dev-quality/references/billing-pix.md`
