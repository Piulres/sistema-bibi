# Evidências dos fluxos funcionais — Sistema Bibi

Material completo (vídeos e imagens) capturado durante a validação do ambiente de
desenvolvimento, demonstrando os fluxos funcionais ponta a ponta e vinculando cada
evidência ao código que a implementa.

- Vídeos: [`videos/`](videos/)
- Imagens: [`imagens/`](imagens/)

> Ambiente validado: `npm install` → `cp .env.example .env` → `npm run db:push` →
> `npm run db:seed` → `npm run lint` (limpo) → `npm run build` (ok) → `npm run dev`
> (servidor em `http://localhost:3000`). Credenciais de demonstração em
> [`../../AGENTS.md`](../../AGENTS.md) e [`../../README.md`](../../README.md).

---

## 1. Prestador — Registrar procedimento (Pay Per Use)

Registro de um procedimento usado no atendimento, com preço congelado no uso e total
atualizado em tempo real.

- Vídeo: [`videos/bibi_prestador_payperuse_demo.mp4`](videos/bibi_prestador_payperuse_demo.mp4)
- Imagens: [`imagens/prestador_agenda.webp`](imagens/prestador_agenda.webp) ·
  [`imagens/prestador_atendimento.webp`](imagens/prestador_atendimento.webp) ·
  [`imagens/procedure_registered.webp`](imagens/procedure_registered.webp)
- Código:
  - `src/components/AtendimentoView.tsx`
  - `src/app/api/prestador/appointments/[id]/procedures/route.ts`
  - `src/lib/invoice-service.ts` (preço congelado em `ProcedureUsage`)

## 2. Interno — Faturamento Pay Per Use (Gerar fatura → PIX → Pagamento)

Geração de fatura a partir dos procedimentos pendentes, emissão de cobrança PIX (mock)
e confirmação do pagamento até o status `PAGA`.

- Vídeo: [`videos/fluxo_interno_faturamento_payperuse.mp4`](videos/fluxo_interno_faturamento_payperuse.mp4)
- Imagens: [`imagens/faturamento_pendentes.webp`](imagens/faturamento_pendentes.webp) ·
  [`imagens/faturamento_pix.webp`](imagens/faturamento_pix.webp) ·
  [`imagens/faturamento_paga.webp`](imagens/faturamento_paga.webp)
- Código:
  - `src/components/BillingView.tsx`
  - `src/app/api/interno/invoices/route.ts`
  - `src/app/api/interno/invoices/[id]/pix/route.ts`
  - `src/app/api/interno/invoices/[id]/confirm-pix/route.ts`

## 3. Beneficiário — Agendamento self-service

Escolha de prestador, data futura e horário disponível, com a consulta aparecendo na
agenda do beneficiário.

- Vídeo: [`videos/fluxo_beneficiario_agendamento.mp4`](videos/fluxo_beneficiario_agendamento.mp4)
- Imagens: [`imagens/beneficiario_overview.webp`](imagens/beneficiario_overview.webp) ·
  [`imagens/agendamento_form.webp`](imagens/agendamento_form.webp) ·
  [`imagens/agendamento_confirmado.webp`](imagens/agendamento_confirmado.webp)
- Código:
  - `src/components/BeneficiarioView.tsx`
  - `src/app/api/beneficiario/providers/route.ts`
  - `src/app/api/beneficiario/slots/route.ts`
  - `src/app/api/beneficiario/appointments/route.ts`

## 4. Interno — Tour administrativo (12 seções)

Navegação por Dashboard Executivo, Faturamento, CRM, Recorrência, Comunicação,
Cadastros, Agenda, Relatórios, White-label, Integrações B2B e Segurança (MFA).

- Vídeo: [`videos/nav2_portal_interno.mp4`](videos/nav2_portal_interno.mp4)
- Imagens: [`imagens/interno_dashboard.webp`](imagens/interno_dashboard.webp) ·
  [`imagens/interno_faturamento.webp`](imagens/interno_faturamento.webp) ·
  [`imagens/interno_crm.webp`](imagens/interno_crm.webp) ·
  [`imagens/interno_assinaturas.webp`](imagens/interno_assinaturas.webp) ·
  [`imagens/interno_branding.webp`](imagens/interno_branding.webp) ·
  [`imagens/interno_integracoes.webp`](imagens/interno_integracoes.webp)
- Código: views administrativas em `src/components/` (`ExecutiveDashboardView`,
  `CrmPipelineView`, `SubscriptionsView`, `ComunicacaoView`, `CadastrosView`,
  `AgendaView`, `ReportsView`, `BrandingView`, `IntegracoesView`, `SecurityView`) e
  rotas em `src/app/api/interno/**`.

## 5. Beneficiário + Empresa (PJ) — Visões consolidadas

Painel self-service do beneficiário e dashboard corporativo (consumo, MRR,
beneficiários, assinaturas, alertas e export CSV).

- Vídeo: [`videos/nav3_beneficiario_pj.mp4`](videos/nav3_beneficiario_pj.mp4)
- Imagens: [`imagens/pj_dashboard.webp`](imagens/pj_dashboard.webp) ·
  [`imagens/pj_beneficiarios.webp`](imagens/pj_beneficiarios.webp)
- Código:
  - `src/components/PjView.tsx`
  - `src/app/api/pj/overview/route.ts`
  - `src/app/api/pj/reports/route.ts`

## Landing & API

- Landing pública: [`imagens/landing.webp`](imagens/landing.webp) — `src/app/page.tsx`
- Swagger UI: [`imagens/swagger_overview.webp`](imagens/swagger_overview.webp) —
  `public/api-docs.html` + `public/openapi.yaml`
