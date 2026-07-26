# CEDIG — gestão clínica

## Docs vivas

- `docs/clientes/cedig/STATUS.md` — status do piloto
- `docs/clientes/cedig/OPERACAO.md` — operação local
- `docs/produto/DOCUMENTOS_CLINICOS.md` — atestado, receita, protocolos de exames (v3.0.5)
- `AGENTS.md` em `docs/clientes/cedig/`

## Código canônico

- `src/lib/clinic-finance/bridge.ts` — ponte clínica ↔ faturamento
- `src/lib/care-journey.ts` — stepper Agendado → Pago no prestador/beneficiário
- `/interno/gestao` — gestão clínica (MEDICAL/DENTAL)
- Tenant demo: `/?tenant=cedig`

## Regras

- Atualizar `STATUS.md` ao fechar entrega CEDIG — não criar `FASE_N` / `GO_LIVE_*`
- Modo operação: ver `docs/plataforma/OPERACAO_DADOS.md`
