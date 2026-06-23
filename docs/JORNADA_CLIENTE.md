# Jornada do Cliente — Quatro Portais

Documentação da **experiência do usuário** em cada portal do Sistema Bibi, com
jornadas típicas, pontos fortes, gaps conhecidos e backlog de melhorias priorizado.

Complementa [`FLUXOS.md`](FLUXOS.md) (ações técnicas e APIs) e [`BENCHMARK.md`](BENCHMARK.md)
(posicionamento vs mercado). Para credenciais demo, ver [`README.md`](../README.md).

Última revisão: alinhada à `main` pós walk-in particular, edição CRUD em Cadastros e mapa `CRUD_OPERATIONS_MAP` (27 entidades).

---

## Índice

1. [Visão macro](#1-visão-macro)
2. [Portal Beneficiário](#2-portal-beneficiário)
3. [Portal PJ (Empresa)](#3-portal-pj-empresa)
4. [Portal Prestador](#4-portal-prestador)
5. [Portal Interno](#5-portal-interno)
6. [Jornada E2E Pay Per Use](#6-jornada-e2e-pay-per-use)
7. [Matriz de maturidade](#7-matriz-de-maturidade)
8. [Backlog priorizado](#8-backlog-priorizado)
9. [Referências cruzadas](#9-referências-cruzadas)

---

## 1. Visão macro

O Sistema Bibi organiza a experiência em **quatro portais segregados por `role`**,
todos alimentados pelo mesmo núcleo **Pay Per Use** (`ProcedureUsage` → `Invoice` → `Payment`).

```mermaid
flowchart TB
  L["/ — Landing"] --> PR["Prestador<br/>/login → /prestador"]
  L --> IN["Interno<br/>/interno/login → /interno/dashboard"]
  L --> PJ["Empresa PJ<br/>/pj/login → /pj"]
  L --> BE["Beneficiário<br/>/beneficiario/login → /beneficiario"]

  subgraph Núcleo Pay Per Use
    AG[Agendamento]
    AT[Atendimento + ProcedureUsage]
    FAT[Faturamento]
    PAY[Pagamento PIX]
  end

  BE --> AG
  IN --> AG
  PR --> AT
  IN --> FAT
  BE --> PAY
  IN --> PAY
  PJ -.->|somente leitura| FAT
  BE -.->|visibilidade| AT
```

| Portal | Público | Login | Destino pós-login | Papel na jornada |
|--------|---------|-------|-------------------|------------------|
| **Beneficiário** | Paciente / colaborador | `/beneficiario/login` | `/beneficiario` | Cliente final — agenda, paga, acompanha |
| **PJ** | RH / gestor corporativo | `/pj/login` | `/pj` | Cliente B2B — monitora consumo e alertas |
| **Prestador** | Médico / profissional | `/login` | `/prestador` | Entrega o serviço clínico |
| **Interno** | Equipe administrativa | `/interno/login` | `/interno/dashboard` | Operação, faturamento e backoffice |

**Entrada pública:** landing (`/`) → seção Portais → login dedicado por perfil.
Descrições de cada portal: `src/lib/landing/content.ts` (`LANDING_PORTALS`).

---

## 2. Portal Beneficiário

**Role:** `BENEFICIARIO` · **Escopo:** `user.patientId` (anti-IDOR) · **Layout SPA:** `src/app/beneficiario/layout.tsx` + `SectionNav` (10 seções)

### 2.1 Jornada típica

| Etapa | Ação do usuário | Onde na UI | Efeito no sistema |
|-------|-----------------|------------|-------------------|
| 1. Entrada | Login com e-mail + senha | `/beneficiario/login` | Sessão escopada ao `patientId` |
| 2. Resumo | Vê próximo atendimento e pendências | `/beneficiario/resumo` | KPIs consolidados |
| 3. Agendar | Escolhe prestador, data, slot, modalidade | `/beneficiario/agendar` | `Appointment` AGENDADO; webhook `APPOINTMENT_CREATED` |
| 4. Consulta | Acessa link telemedicina ou comparece | `/beneficiario/agenda` | — |
| 5. Cancelar | Cancela consulta futura (se AGENDADO) | `/beneficiario/agenda` | `PATCH …/appointments/[id]` libera slot |
| 6. Pós-atendimento | Consulta consumo Pay Per Use | `/beneficiario/consumo` | Procedimentos `billed` / não `billed` |
| 7. Care Chart | Vê medicações e exames | `/beneficiario/medicacoes` · `/beneficiario/exames` | Somente leitura |
| 8. Faturamento | Aguarda fatura emitida pelo interno | `/beneficiario/faturas` | — |
| 9. Pagamento | Gera PIX → confirma pagamento | `/beneficiario/faturas` | `Invoice` PAGA |
| 10. Export | Baixa seção em PDF/Excel | Botões em cada seção | `GET /api/beneficiario/export?section=` |
| 11. Acompanhamento | PEP, assinatura, timeline | `/beneficiario/prontuario` · `/beneficiario/historico` | Somente leitura |

### 2.2 Pontos fortes

- Self-service completo: agendar, cancelar, pagar e ver consumo.
- Navegação SPA por seção (sem scroll infinito).
- Transparência Pay Per Use com preço congelado (`priceCharged`).
- Export PDF/Excel por seção (consumo, agenda, prontuário, …).
- Escopo estrito por `patientId` — sem acesso a dados de terceiros.

### 2.3 Gaps e melhorias

| Prioridade | Gap | Sugestão |
|:----------:|-----|----------|
| Alta | PIX em dois passos manuais (gerar + confirmar) | Webhook do gateway ou polling; exibir QR Code |
| Média | Reagendar consulta | Fluxo cancelar + novo agendamento |
| Média | Slots fixos (8h–18h, 30 min) | Grade configurável por prestador (`scheduling-service.ts`) |
| Média | Notificações mock (`COMMUNICATION_PROVIDER=console`) | Adapter real (e-mail/SMS/WhatsApp) |
| Baixa | Sem carteirinha digital | Card com QR + dados do plano corporativo |
| Baixa | Sem PWA / app nativo | PWA instalável com push de lembrete |

**Código:** views em `src/app/beneficiario/*/page.tsx` · APIs em `src/app/api/beneficiario/` · nav em `src/lib/navigation/routes.ts`

---

## 3. Portal PJ (Empresa)

**Role:** `PJ` · **Escopo:** `user.companyId` · **View:** `PjView` · **Modo:** somente leitura + export (CSV/PDF/Excel)

### 3.1 Jornada típica

| Etapa | Ação do usuário | Onde na UI | Efeito |
|-------|-----------------|------------|--------|
| 1. Entrada | Login PJ | `/pj/login` | Escopo limitado ao `companyId` |
| 2. Alertas | Lê avisos de inadimplência, faturas abertas, cobranças vencidas | Topo da página | Alertas com âncoras (`#assinaturas`) |
| 3. KPIs | Vê contrato, beneficiários, consumo PPU, MRR | Cards de resumo | `getPjPortalOverview()` |
| 4. Drill-down | Analisa consumo por colaborador | Tabela “Beneficiários” | Consumo e pendente por CPF |
| 5. Export | Baixa relatório | Botão export | `GET /api/pj/reports` (CSV padrão; `format=pdf\|xlsx`) |

### 3.2 Pontos fortes

- Alertas proativos (inadimplência, negociação, faturas abertas).
- Consumo granular por beneficiário — core B2B.
- Export CSV, PDF e Excel para integração com ERP/planilha.

### 3.3 Gaps e melhorias

| Prioridade | Gap | Sugestão |
|:----------:|-----|----------|
| Alta | 100% somente leitura — RH não executa ações | Gestão de beneficiários (incluir/excluir), upload em lote |
| Alta | Sem pagamento corporativo consolidado | Fatura por empresa + boleto/PIX corporativo |
| Média | Sem filtros por período ou status | Filtros + gráfico de tendência de consumo |
| Média | Alertas sem ação resolutiva (só âncora na página) | Contato comercial, abertura de chamado |
| Média | Sem drill-down por beneficiário | Clique no colaborador → detalhe consumo/faturas |
| Baixa | Sem SSO corporativo | OAuth/SAML via IdP da empresa |
| Baixa | Sem contrato digital | Visualização/assinatura de proposta no portal |

**Código:** `src/components/PjView.tsx` · `src/lib/pj-portal-service.ts`

---

## 4. Portal Prestador

**Role:** `PRESTADOR` · **Nav SPA:** `PRESTADOR_NAV_TABS` · **Views:** dashboard, agenda, pacientes, extrato, relatórios, atendimento

### 4.1 Jornada típica

| Etapa | Ação do usuário | Onde na UI | Efeito |
|-------|-----------------|------------|--------|
| 1. Entrada | Login prestador | `/login` | Sessão `PRESTADOR` |
| 2. Dashboard | Vê KPIs e atalhos | `/prestador/dashboard` | `GET /api/prestador/dashboard` |
| 3. Agenda do dia | Vê consultas de hoje | `/prestador` | `GET /api/prestador/agenda` |
| 4. Abrir atendimento | Clica no card do paciente | `/prestador/atendimento/[id]` | Detalhe: paciente, empresa, procedimentos, Care Chart |
| 5. Registrar uso | Adiciona procedimento do catálogo | Formulário de procedimentos | `ProcedureUsage` com `priceCharged` congelado |
| 6. PEP / Care Chart | Salva evolução; medicações/exames | Templates PEP + sidebar clínica | `MedicalRecord` + timeline |
| 7. Concluir | Marca REALIZADO | Botão de conclusão | Libera faturamento interno |
| 8. Histórico | Consulta paciente fora do dia | `/prestador/pacientes` → `/prestador/paciente/[id]` | Care Chart completo |
| 9. Extrato / relatórios | Exporta produção | `/prestador/extrato` · `/prestador/relatorios` | PDF/Excel |

### 4.2 Pontos fortes

- Fluxo clínico enxuto: agenda → atendimento → PEP → conclusão.
- Care Chart integrado (medicação, exames, protocolos).
- Preço congelado no momento do uso (Pay Per Use).
- Export PDF/Excel de extrato, relatórios e PEP.
- Templates PEP (`pep-templates.ts`) aceleram documentação.

### 4.3 Gaps e melhorias

| Prioridade | Gap | Sugestão |
|:----------:|-----|----------|
| Alta | Só exibe agenda do dia na aba Agenda | Calendário semanal/mensal + filtros |
| Média | Telemedicina mock | Embed real (Twilio/Whereby) na tela de atendimento |
| Média | Sem assinatura digital em receitas/atestados | Conformidade CFM + PDF |
| Baixa | Sem fila automática de atendimento | “Próximo paciente” após marcar REALIZADO |

**Código:** `src/app/prestador/*/page.tsx` · `AgendaView` · `AtendimentoView` · nav em `src/lib/navigation/routes.ts`

---

## 5. Portal Interno

**Role:** `INTERNO` · **RBAC:** `internoProfile` · **Nav:** `InternoNav` filtrada por permissões

### 5.1 Jornada por perfil

```mermaid
flowchart LR
  subgraph ADMIN
    D[Dashboard] --> B[Faturamento]
    D --> C[Cadastros]
    D --> CRM[CRM]
    D --> SUB[Recorrência]
    D --> INT[Integrações]
  end

  subgraph RECEPCAO
    D2[Dashboard] --> AG[Agenda]
    D2 --> CAD[Cadastros]
    D2 --> COM[Comunicação]
  end

  subgraph FATURAMENTO
    D3[Dashboard] --> B2[Faturamento]
    D3 --> SUB2[Recorrência]
    D3 --> REL[Relatórios]
    D3 --> AUD[Auditoria]
  end
```

| Módulo | Rota | Jornada principal |
|--------|------|-------------------|
| Dashboard | `/interno/dashboard` | KPIs → links rápidos (faturamento, CRM, recorrência) |
| Faturamento | `/interno` | Pendências PPU → gerar fatura → PIX / marcar paga → TISS XML |
| Agenda | `/interno/agenda` | CRUD agendamentos, **walk-in particular**, check-in, modalidade TELE |
| Cadastros | `/interno/cadastros` | Beneficiários, empresas, procedimentos, usuários (criar + **editar**) |
| Mapa CRUD | `/interno/cadastros?tab=operations` | 27 entidades — telas, rotas API, filtro por portal |
| CRM | `/interno/crm` | Pipeline lead → ativo (kanban) |
| Recorrência | `/interno/assinaturas` | Assinaturas → gerar cobranças → faturar |
| Comunicação | `/interno/comunicacao` | Fila de mensagens + lembretes automáticos |
| Relatórios | `/interno/relatorios` | Export CSV/PDF/Excel (faturamento, CRM) |
| Auditoria | `/interno/auditoria` | Timeline universal do tenant + export |
| Cliente 360° | `/interno/beneficiarios/[id]` | Visão unificada + export LGPD/PDF |

Matriz completa perfil × módulo: [`FLUXOS.md`](FLUXOS.md) §9.

### 5.2 Pontos fortes

- Cobertura operacional ampla (table stakes + B2B).
- RBAC na navegação e em parte das APIs.
- Cliente 360° com timeline universal de auditoria.

### 5.3 Gaps e melhorias

| Prioridade | Gap | Sugestão |
|:----------:|-----|----------|
| Alta | RBAC incompleto nas APIs — RECEPCAO pode chamar URLs diretas | `requireInternoModule()` em todas as mutações |
| Alta | Cliente 360° sem RBAC de módulo | Restringir por perfil (ex.: ADMIN/RECEPCAO) |
| Média | Faturamento em `/interno` (rota não óbvia) | Alias `/interno/faturamento` já redireciona — destacar na nav |
| Média | Sem workflow guiado de faturamento em lote | Wizard: pendências → selecionar pacientes → gerar lote |
| Média | TISS simplificado | Validação XSD + campos ANS completos |
| Baixa | 12 abas na nav — sobrecarga cognitiva | Agrupar: Operação · Financeiro · Plataforma |

**Melhorias visuais implementadas (2026-06):** `StatCard` unificado em dashboard/PJ/beneficiário/faturamento; `FlowStepper` na jornada PPU; `CalloutCard` + `AppointmentCard` na agenda interna e prestador; `TabBar` em Cadastros; `EmptyState` com título e dica.

**Código:** `src/components/InternoNav.tsx` · `src/lib/interno-permissions.ts` · `docs/DESIGN_SYSTEM.md`

---

## 6. Jornada E2E Pay Per Use

Fluxo cross-portal que conecta os quatro perfis — núcleo do produto.

```mermaid
sequenceDiagram
  participant B as Beneficiário
  participant R as Recepção (Interno)
  participant P as Prestador
  participant F as Faturamento (Interno)
  participant PJ as RH (PJ)

  Note over B,R: 1. Agendamento
  B->>B: Self-service OU
  R->>R: /interno/agenda (cadastrado)
  R->>R: /interno/agenda walk-in (particular)

  Note over P: 2. Atendimento
  P->>P: Registrar procedimento (preço congelado)
  P->>P: Salvar PEP
  P->>P: Marcar REALIZADO

  Note over F: 3. Faturamento
  F->>F: Gerar fatura (usages billed=true)
  F->>F: Emitir PIX / TISS

  Note over B,F: 4. Pagamento
  B->>B: Pagar PIX (self-service)
  alt ou
    F->>F: Marcar paga manualmente
  end

  Note over B,PJ: 5. Visibilidade
  B->>B: Ver consumo e histórico
  PJ->>PJ: Ver consumo corporativo + alertas
```

### 6.1 Gaps na jornada cross-portal

| # | Gap | Impacto | Melhoria sugerida |
|---|-----|---------|-------------------|
| 1 | Beneficiário agenda, mas confirmação é manual na recepção | Fricção operacional | Confirmação automática ou notificação push |
| 2 | Sem indicador visual de progresso entre portais | Usuário não sabe “onde está” no ciclo | **Parcial:** `FlowStepper` + `care-journey.ts` no Beneficiário e Prestador; mapa em `flow-improvements-map.ts` |
| 3 | PJ vê alertas, mas não pode resolver | RH depende de suporte | Self-service de regularização ou chat |
| 4 | Lembretes automáticos mock (`console`) | Paciente não recebe lembrete real | Adapter SendGrid/Twilio em produção |
| 5 | Sem repasse ao prestador | Prestador não vê receita gerada | Módulo de repasse / extrato prestador |

Detalhe técnico do fluxo: [`FLUXOS.md`](FLUXOS.md) §7.

---

## 7. Matriz de maturidade

Escala por dimensão de jornada (não cobertura de código).

| Dimensão | Beneficiário | PJ | Prestador | Interno |
|----------|:------------:|:--:|:---------:|:-------:|
| Onboarding / login | ✅ | ✅ | ✅ | ✅ (+ MFA) |
| Self-service | ✅ agendar + pagar | ❌ só leitura | 🟡 só atendimento | ✅ CRUD completo |
| Transparência financeira | ⭐ ✅ | ⭐ ✅ | 🟡 vê preço no ato | ✅ |
| Comunicação proativa | 🟡 mock | 🟡 alertas passivos | ❌ | 🟡 fila mock |
| Mobile / PWA | 🟡 drawer + nav rolável | 🟡 drawer seções | ✅ 1 aba | 🟡 drawer &lt; lg |
| Integrações reais | 🟡 PIX mock | 🟡 CSV only | ❌ | 🟡 webhooks OK, TISS parcial |

Legenda: ✅ implementado · 🟡 parcial/mock · ❌ ausente · ⭐ diferencial vs mercado clínico.

Scorecard vs concorrentes: [`BENCHMARK.md`](BENCHMARK.md) §4.

---

## 8. Backlog priorizado

Top 10 melhorias por impacto na jornada do cliente (ordenado por prioridade sugerida).

| # | Melhoria | Portal(es) | Impacto | Tier sugerido |
|---|----------|------------|---------|---------------|
| 1 | Cancelar/reagendar consulta | Beneficiário | Reduz carga da recepção | 5 | **Cancelar:** ✅ `PATCH …/beneficiario/appointments/[id]` · Reagendar: backlog |
| 2 | PIX com confirmação automática | Beneficiário, Interno | Elimina passo manual | 5 |
| 3 | RBAC 100% nas APIs internas | Interno | Segurança enterprise | 5 |
| 4 | Gestão de beneficiários no portal PJ | PJ | Desbloqueia valor B2B | 5 |
| 5 | Agenda semanal do prestador | Prestador | Operação clínica madura | 5 |
| 6 | Navegação por abas no portal Beneficiário | Beneficiário | UX mobile | 5 | **Drawer mobile:** ✅ `MobileSectionDrawer` + `SectionNav` |
| 7 | Notificações reais (e-mail/SMS) | Todos | Lembretes e confirmações | 5 |
| 8 | Drill-down por beneficiário no PJ | PJ | Analytics corporativo | 5+ |
| 9 | Status tracker cross-portal | Todos | Visibilidade do ciclo PPU | 5+ | **Parcial:** `FlowStepper` Beneficiário/Prestador |
| 10 | Gateway PIX real (Asaas/Efí) | Beneficiário, Interno | Receita em produção | 5 |

Gaps técnicos adicionais (SSO, Postgres, TISS XSD, telemedicina real): [`BENCHMARK.md`](BENCHMARK.md) §5.

---

## 9. Referências cruzadas

| Documento | Conteúdo relacionado |
|-----------|---------------------|
| [`FLUXOS.md`](FLUXOS.md) | Ações técnicas, APIs, RBAC, máquinas de estado, §8.7 melhorias de fluxo |
| `src/lib/flow-improvements-map.ts` | Mapa canônico implementado vs backlog |
| [`AUDITORIA_FLUXOS.md`](AUDITORIA_FLUXOS.md) | Falhas mapeadas por portal (segurança, RBAC API, bugs) |
| [`BENCHMARK.md`](BENCHMARK.md) | Posicionamento vs iClinic/Feegow/ERPMed |
| [`PAYMENTS.md`](PAYMENTS.md) | Motor PIX e ciclo de cobrança |
| [`COMMUNICATIONS.md`](COMMUNICATIONS.md) | Lembretes e fila de mensagens |
| [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) | UI dos portais (`PortalShell`, tokens) |
| [`evidencias/README.md`](evidencias/README.md) | Screenshots e vídeos dos fluxos validados |
| [`OPERACOES.md`](OPERACOES.md) | Quando atualizar esta documentação |

---

*Documento derivado do código em `src/app/`, `src/components/` e `src/lib/`, e da análise de jornada dos quatro portais.*
