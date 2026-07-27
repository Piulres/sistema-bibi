# Jornada no consultório — narrativa operacional

Documentação **narrativa** do ciclo clínico-operacional do Sistema Bibi - ServiceOS:
cliente chega → agenda → médico atende → operador fecha (faturamento, pagamento e anexos).

Complementa (não substitui):

| Documento | Papel |
|-----------|--------|
| [`FLUXOS.md`](FLUXOS.md) | Ações técnicas, APIs, RBAC, máquinas de estado |
| [`JORNADA_CLIENTE.md`](JORNADA_CLIENTE.md) | UX por portal, gaps e backlog |
| [`DOCUMENTOS_CLINICOS.md`](DOCUMENTOS_CLINICOS.md) | Atestado, receita, protocolos |
| [`../clientes/cedig/STATUS.md`](../clientes/cedig/STATUS.md) | Gestão clínica CEDIG / ponte |

> **Labels:** em UI autenticada o vocabulário vem de `useLabels()` (paciente/cliente/pet/aluno conforme o nicho). Neste documento usamos linguagem de **consultório** (`MEDICAL`) por legibilidade operacional.

**Última revisão:** julho/2026 — alinhado a `FLUXOS.md` v3.0.16 e pacote em produção — ver [`../versoes/RELEASES.md`](../versoes/RELEASES.md).

---

## Índice

0. [Quem atua e quem é o cliente](#0-quem-atua-e-quem-é-o-cliente)
1. [Ato 1 — Marcar a consulta](#1-ato-1--marcar-a-consulta)
2. [Ato 2 — Chegada e confirmação](#2-ato-2--chegada-e-confirmação)
3. [Ato 3 — Médico atende](#3-ato-3--médico-atende)
4. [Ato 4 — Fechar: faturamento, pagamento e outros](#4-ato-4--fechar-faturamento-pagamento-e-outros)
5. [Mapa de ramificações](#5-mapa-de-ramificações)
6. [Dia típico (roteiro operacional)](#6-dia-típico-roteiro-operacional)
7. [Estados canônicos](#7-estados-canônicos)
8. [Credenciais demo](#8-credenciais-demo)

---

## 0. Quem atua e quem é o cliente

### Portais na história

| Papel | Portal | Quando entra |
|-------|--------|--------------|
| Recepção / operação | Interno (`RECEPCAO` ou `ADMIN`) | Agenda, check-in, cadastro, comunicação, estoque |
| Caixa / faturamento | Interno (`FATURAMENTO` ou `ADMIN`) | Emite fatura, PIX, TISS, assinaturas |
| Médico / profissional | Prestador | Atende, PEP, procedimentos, conclui |
| Cliente final | Beneficiário | Pode agendar e pagar sozinho |
| Empresa (se corporativo) | PJ | Só acompanha (leitura + export) |

**RBAC interno:** recepção **não** acessa billing; faturamento **não** acessa agenda/cadastros. `ADMIN` faz tudo. `READONLY` só lê dashboard/relatórios/auditoria. Matriz: [`FLUXOS.md`](FLUXOS.md) §9.

### Tipos de cliente que chegam

1. **Particular já cadastrado** — `Patient` sem `companyId` (demo: `pedro.almeida@email.com`)
2. **Particular walk-in** — ainda sem ficha; recepção cadastra na hora
3. **Beneficiário corporativo** — ligado a empresa PJ (demo: `joao.pereira@email.com` / TechCorp)
4. **Self-service** — o próprio beneficiário agenda pelo portal, sem passar pela recepção no início

---

## 1. Ato 1 — Marcar a consulta

Qualquer caminho termina em um `Appointment`. Status inicial costuma ser **`AGENDADO`** (ou já **`CONFIRMADO`** se a recepção usar o default do formulário).

### Opção A — Recepção agenda paciente já cadastrado

- **Tela:** `/interno/agenda`
- Escolhe paciente + prestador + data/hora
- Modalidade: **`PRESENCIAL`** ou **`TELE`** (TELE gera `telemedicineUrl`)
- Dispara webhook `APPOINTMENT_CREATED`
- Detalhe técnico: [`FLUXOS.md`](FLUXOS.md) §4.2

### Opção B — Walk-in particular (sem ficha)

Na mesma agenda (`/interno/agenda`):

1. Preenche nome, CPF, nascimento, prestador
2. **Cadastrar e agendar agora** → `POST /patients` (sem empresa) + `POST /appointments` (`AGENDADO`)
3. Opcional: criar usuário do portal beneficiário (`POST /users`)

Detalhe: [`FLUXOS.md`](FLUXOS.md) §8.5.

### Opção C — Beneficiário agenda sozinho

- **Tela:** `/beneficiario/agendar`
- Escolhe prestador → slots (8h–18h, 30 min) → modalidade → cria `AGENDADO`
- Também dispara `APPOINTMENT_CREATED`
- Detalhe: [`FLUXOS.md`](FLUXOS.md) §6

### Opção D — Caminho CEDIG / gestão clínica (paralelo, MEDICAL/DENTAL)

- Em vez (ou além) da agenda clássica: `/interno/gestao`
- Lançamento de exame/procedimento pode **pontar** automaticamente `Patient` + `Appointment` + `ProcedureUsage` + `Invoice`
- `bridgeStatus`: `SYNCED` | `PARTIAL` | `FAILED` | `SKIPPED`
- Da agenda, dá para **“Lançar na gestão”** com prefill
- Detalhe: [`FLUXOS.md`](FLUXOS.md) §4.2.1 · [`../clientes/cedig/STATUS.md`](../clientes/cedig/STATUS.md)

### Depois de agendar (opcionais laterais)

| Ação | Onde | Efeito |
|------|------|--------|
| Lembrete 24h | Comunicação / cron | Template `APPOINTMENT_REMINDER` (mock/console na POC) |
| Mensagem manual | `/interno/comunicacao` | Fila `PENDENTE` → despacho |
| Cancelar (beneficiário) | Minha agenda | Só se `AGENDADO` e consulta futura; libera slot |
| Cancelar / faltou (interno) | `/interno/agenda` | `CANCELADO` ou `FALTOU`; libera slot |

---

## 2. Ato 2 — Chegada e confirmação

Antes do médico atender de fato, o status costuma ir para **`CONFIRMADO`**.

### Quem pode confirmar

| Quem | Onde | Como |
|------|------|------|
| Recepção | `/interno/agenda` | Check-in “confirmar chegada” |
| Prestador | `/prestador/atendimento/[id]` | “Paciente presente” |

### Modalidade no dia

- **Presencial** — comparece na clínica
- **Tele** — abre o link de telemedicina na agenda do beneficiário / atendimento

### Desvios neste ato

| Situação | Status |
|----------|--------|
| Não veio | `FALTOU` |
| Desistiu | `CANCELADO` |
| Ainda não chegou | permanece `AGENDADO` (stepper: Agendado) |

---

## 3. Ato 3 — Médico atende

**Portal:** `/prestador` → `/prestador/atendimento/[id]`  
Detalhe técnico: [`FLUXOS.md`](FLUXOS.md) §3 · documentos: [`DOCUMENTOS_CLINICOS.md`](DOCUMENTOS_CLINICOS.md).

### Núcleo obrigatório do Pay Per Use

1. Abrir atendimento
2. **Registrar procedimento(s)** do catálogo → `ProcedureUsage` com preço **congelado** (`priceCharged`)
   - Particular → preço base
   - Corporativo → pode aplicar `PricingRule.multiplier` da empresa (ex.: 0,85)
3. Marcar **`REALIZADO`** → libera faturamento

### Complementos clínicos (qualquer combinação)

| Área | Opções |
|------|--------|
| **PEP** | Evolução / templates; atestado (afastamento, acompanhamento, comparecimento + CID com autorização); receita no texto |
| **Medicação** | Receita `COMUM` ou `CONTROLE_ESPECIAL`; status `ATIVA` / `SUSPENSA` / `ENCERRADA` + reativar |
| **Exames** | Pedido avulso; aplicar **protocolo de exames** (gera N `ExamOrder`); laudo |
| **Protocolos de cuidado** | Templates cadastrados no interno (`/interno/cadastros?tab=protocols`) |
| **Estoque** (lado interno) | Kits por procedimento, lotes, movimentações — apoio operacional |

### Stepper no atendimento

Ordem visual: **Agendado → Confirmado → Realizado → Faturado → Pago**  
(pagamento “vence” realizado quando a fatura já está paga — `care-journey.ts`).

---

## 4. Ato 4 — Fechar: faturamento, pagamento e outros

**Quem opera:** perfil com módulo **`billing`** (`FATURAMENTO` / `ADMIN`) em `/interno` (Billing).  
Recepção **não** fecha fatura. Detalhe: [`FLUXOS.md`](FLUXOS.md) §4.1 · §7.

### 4.1 Emitir fatura (obrigatório no ciclo PPU)

1. Lista usages `billed=false`
2. `POST /invoices` por paciente → usages `billed=true`, `Invoice` nasce **`FECHADA`**
3. Webhook `INVOICE_ISSUED`

### 4.2 Cobrar — todas as opções

| Caminho | Quem | Como | Resultado |
|---------|------|------|-----------|
| PIX na recepção/caixa | Interno (billing) | Gerar PIX → Confirmar PIX | `Payment` PENDING→CONFIRMED; Invoice **`PAGA`** |
| Marcar paga (manual) | Interno (billing) | Botão **Marcar paga** | Invoice **`PAGA`** direto |
| Self-service | Beneficiário | `/beneficiario/faturas` → gerar PIX → confirmar | Idem |

Só fatura **`FECHADA`** aceita pagamento. **`PAGA`** é terminal.

### 4.3 “Outros” no fechamento (opcionais)

| Ação | Onde | Para quê |
|------|------|----------|
| **Export TISS** (XML) | Billing | Guia para operadora — exige itens + CPF; senão 422 |
| **Export faturamento** | CSV/PDF/JSON/TXT/XLSX | Contabilidade / arquivo |
| **Assinatura / recorrência** | `/interno/assinaturas` | Cobrança recorrente (paralela ao PPU unitário) |
| **Lembrete de fatura** | Comunicação / cron | Template `INVOICE_DUE` |
| **Webhook ERP** | Integrações | Entrega `INVOICE_ISSUED` com retry |
| **Auditoria** | Timeline | Rastreio do ciclo |
| **Cliente 360°** | `/interno/beneficiarios/[id]` | Visão consolidada + export LGPD |
| **Gestão CEDIG** | `/interno/gestao` | Despesas, KPIs, export mensal, ponte do lançamento |
| **Estoque** | Baixa/kits | Se o procedimento consumiu insumos |

### 4.4 Depois de pago — quem vê o quê

| Quem | O quê |
|------|-------|
| Beneficiário | Consumo billed/não billed, faturas, PEP leitura, histórico, medicações, exames, plano, assinatura |
| PJ (se corporativo) | KPIs, consumo por colaborador, faturas, alertas — **sem pagar** no portal |
| Prestador | Stepper chega em **Pago**; extrato exportável |
| Interno | Dashboard (PPU pendente, faturado, atendimentos do dia), relatórios |

---

## 5. Mapa de ramificações

```text
CLIENTE
 ├─ Particular walk-in ──► Interno cadastra + agenda
 ├─ Particular/cadastrado ──► Interno agenda
 ├─ Corporativo ──► Interno agenda  OU  Beneficiário self-service
 └─ (MEDICAL/DENTAL) ──► opcional: Gestão CEDIG (ponte)

APPOINTMENT
 ├─ AGENDADO ──► cancelar / faltou / check-in
 ├─ CONFIRMADO ──► (recepção OU médico)
 │     modalidade: PRESENCIAL | TELE
 └─ REALIZADO ──► médico + ProcedureUsage (+ PEP/receita/exames/protocolos)

FATURAMENTO (Interno billing)
 └─ Invoice FECHADA
       ├─ PIX (interno) ──► confirm
       ├─ Marcar paga (interno)
       ├─ PIX (beneficiário) ──► confirm
       ├─ TISS (opcional)
       └─ lembretes / webhooks / exports
             └─ Invoice PAGA

VISIBILIDADE
 ├─ Beneficiário acompanha
 ├─ PJ acompanha (se empresa)
 └─ Interno/Prestador veem ciclo no stepper
```

Diagrama técnico (Mermaid): [`FLUXOS.md`](FLUXOS.md) §7.

---

## 6. Dia típico (roteiro operacional)

Cenário: *cliente particular ou beneficiário já registrado chega, marca consulta; operador registra; médico atende; operador fecha com pagamento e anexos.*

| # | Quem | Ação | Tela / resultado |
|---|------|------|------------------|
| 1 | Cliente | Chega (ou já tinha agendado self-service) | — |
| 2 | Operador interno (recepção) | Walk-in: cadastra + agenda · Já cadastrado: só agenda · Já agendado: só confere | `/interno/agenda` → `AGENDADO` |
| 3 | Operador interno (recepção) | Check-in de chegada | mesma agenda → `CONFIRMADO` |
| 4 | Médico | Abre atendimento, lança procedimento(s), opcional PEP/receita/exames/protocolos | `/prestador/atendimento/[id]` → `REALIZADO` |
| 5 | Operador interno (faturamento) | Emite fatura | `/interno` (Billing) → Invoice `FECHADA` |
| 6 | Caixa / beneficiário | PIX interno, marcar paga, ou PIX no portal do cliente | Invoice `PAGA` |
| 7 | (Opcional) | TISS, export, lembrete, gestão CEDIG, estoque, auditoria | módulos internos |
| 8 | Beneficiário / PJ / prestador | Acompanham ciclo no stepper e painéis | portais respectivos |

---

## 7. Estados canônicos

### Consulta (`Appointment`)

`AGENDADO` → `CONFIRMADO` → `REALIZADO`  
Desvios: `CANCELADO` | `FALTOU` (liberam slot).

### Fatura (`Invoice`) / pagamento

Usages (`billed=false`) → Invoice **`FECHADA`** → pagamento → **`PAGA`** (terminal).  
`Payment`: `PENDING` | `CONFIRMED` | `FAILED` | `CANCELLED`.

Máquinas completas: [`FLUXOS.md`](FLUXOS.md) §10.

### Stepper da jornada clínica

Prioridade em `resolveCareJourneyStep()`: `pago` → `faturado` → `realizado` → `confirmado` → `agendado`.  
Fonte: `src/lib/care-journey.ts` · mapa UX: `src/lib/flow-improvements-map.ts`.

---

## 8. Credenciais demo

Senha: **`bibi123`**.

| Papel | Login | E-mail |
|-------|-------|--------|
| Prestador | `/login` | `dra.helena@bibi.health` |
| Interno (admin / faturamento) | `/interno/login` | `faturamento@bibi.health` |
| Interno (recepção) | `/interno/login` | `recepcao@bibi.health` |
| Beneficiário corporativo | `/beneficiario/login` | `joao.pereira@email.com` |
| Beneficiário particular | `/beneficiario/login` | `pedro.almeida@email.com` |
| PJ | `/pj/login` | `rh@techcorp.com` |

Lista completa: [`README.md`](../../README.md) · [`AGENTS.md`](../../AGENTS.md).

---

## 9. Massa e testes automatizados

O seed inclui uma **camada de mês operacional** com datas relativas a “hoje” (agenda, PPU, PEP, estoque, faturas, timeline e launches CEDIG). Marcador `[seed-operation-month]` — ver [`../plataforma/MASSA_TESTES.md`](../plataforma/MASSA_TESTES.md).

| Camada | Arquivo | O que cobre |
|--------|---------|-------------|
| Plano puro (~30 dias) | `tests/unit/operation-month-plan.test.ts` | Fontes, status, CEDIG, janela |
| Consistência seed | `tests/lib/operation-month-consistency.test.ts` | Densidade, descontos, PPU↔fatura, PEP, estoque, timeline |
| API (Atos 1–4) | `tests/api/consultorio-journey.test.ts` | Walk-in → check-in → PEP → procedimento/estoque → REALIZADO → fatura PIX / marcar paga + RBAC cadastros/estoque |
| Stepper | `tests/lib/care-journey.test.ts` | Agendado → … → Pago |
| E2E UI | `e2e/jornada-consultorio.spec.ts` | Módulos operacionais + walk-in/check-in + superfície atendimento |
| Walk-in | `e2e/walkin-particular.spec.ts` | Cadastro walk-in + check-in |
| Índice | [`../plataforma/TESTES.md`](../plataforma/TESTES.md) | Matriz completa |

```bash
npx vitest run tests/unit/operation-month-plan.test.ts tests/lib/operation-month-consistency.test.ts tests/api/consultorio-journey.test.ts
npx playwright test e2e/jornada-consultorio.spec.ts --project=chromium
```

---

## Referências cruzadas

| Documento | Conteúdo |
|-----------|----------|
| [`FLUXOS.md`](FLUXOS.md) §7 | Fluxo master PPU (Mermaid + APIs) |
| [`FLUXOS.md`](FLUXOS.md) §8.5 | Walk-in particular |
| [`FLUXOS.md`](FLUXOS.md) §8.9 | Melhorias de fluxo (check-in, cancelar, stepper) |
| [`JORNADA_CLIENTE.md`](JORNADA_CLIENTE.md) §6 | Jornada E2E UX |
| [`DOCUMENTOS_CLINICOS.md`](DOCUMENTOS_CLINICOS.md) | Atestado, receita, protocolos |
| [`../plataforma/MASSA_TESTES.md`](../plataforma/MASSA_TESTES.md) | Perfis de seed + mês operacional |
| [`../plataforma/PAYMENTS.md`](../plataforma/PAYMENTS.md) | Motor PIX |
| [`../evidencias/README.md`](../evidencias/README.md) | Screenshots e vídeos |

---

*Narrativa operacional derivada do código e de `FLUXOS.md` / `JORNADA_CLIENTE.md`. Em dúvida de API ou RBAC, prevalece `FLUXOS.md`.*
