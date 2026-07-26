# Histórico de validação — CEDIG Cruzeiro

Registro das rodadas de homologação assistida (browser + massa) do piloto CEDIG no ServiceOS.

Complementa [`ROTEIRO_HOMOLOGACAO.md`](ROTEIRO_HOMOLOGACAO.md) · [`README.md`](README.md) · [`MASSA_TESTES.md`](../../plataforma/MASSA_TESTES.md).

---

## Massa CEDIG (seed atual)

| Entidade | Quantidade / contas |
|----------|---------------------|
| Tenant | `cedig` · MEDICAL · branding CEDIG Cruzeiro |
| Procedimentos | 5 (Endo, Colo, Endo+Colo, Mucosectomia, Teste respiratório) |
| Interno | `operacao@cedig.demo` (ADMIN) · `alana@cedig.demo` / `recepcao@cedig.demo` · João Marcos · Márcia |
| Prestadores | Alexandre Marçal · Luiza Lage · Bruno Dias · Luiza Zeraik · Fernanda Auto |
| Empresas PJ | CentralMed · Bem Saúde |
| PJ | `rh@centralmed.demo` |
| Pacientes / Beneficiários | Maria Silva · José Santos · Ana Particular (`*.cedig@email.com`) |
| Senha demo | `bibi123` |

> Histórico operacional (agenda, faturas, PPU) começa vazio de propósito — clínica greenfield no piloto.

---

## Rodadas

### 2026-07-25a — Gestão clínica (financeiro)

| Item | Resultado |
|------|-----------|
| Ambiente | `localhost:3000` · demo.db · `/?tenant=cedig` |
| Login | `alana@cedig.demo` |
| Escopo | `/interno/gestao` — lançamentos, despesas, KPIs |
| C1–C4 preços | ✅ 900 / 1250 / 3200 / 450 |
| Despesas | ✅ lab + equipe |
| Bug corrigido | `getPrisma()` em `clinic-finance/service.ts` |
| Evidências | `/opt/cursor/artifacts/cedig-homologacao/` |

### 2026-07-25b — Quatro portais + cadastros + UX

Ambiente: `localhost:3000` · massa expandida · browser Claude 4.6 Sonnet (computerUse).  
Evidências: `/opt/cursor/artifacts/cedig-4portais/`.

#### Interno ADMIN (`operacao@cedig.demo`)

| Aba | Status | Nota |
|-----|--------|------|
| Dashboard | ✅ | 3 beneficiários · 2 empresas |
| Faturamento | ✅ | empty state (esperado) |
| Exames (Agenda) | ✅ | walk-in + catálogo CEDIG |
| Cadastros → Beneficiários | ✅ | Maria, José, Ana |
| Cadastros → Empresas | ✅ | CentralMed · Bem Saúde |
| Cadastros → Exames | ✅ | 5 procedimentos + preços Particular |
| Cadastros → Precificação / Protocolos / Usuários / Mapa CRUD | ✅ | usuários e 27 entidades |
| Estoque clínico | ✅ | vazio (esperado) |
| CRM | ✅ | pipeline com as 2 empresas |
| Gestão clínica | ✅ | formulário + sugestão de preço |
| Segurança | ✅ | MFA / demo↔operação |
| Recorrência · Comunicação · Relatórios · Auditoria · White Label · Integrações | 🟡 | nav presente; amostragem parcial nesta rodada |

#### Interno RECEPCAO (`alana@cedig.demo`)

| Check | Status |
|-------|--------|
| Gestão / Agenda / Cadastros / Estoque / Comunicação | ✅ visíveis |
| Faturamento / Segurança | ✅ ocultos (RBAC) |

#### Prestador (`bruno.dias@cedig.demo`)

| Aba | Status | Nota |
|-----|--------|------|
| Início | ✅ | boas-vindas Dr. Bruno Dias · métricas 0 |
| Agenda | ✅ | empty |
| Pacientes | ✅ | empty (sem atendimentos vinculados ao médico — esperado) |
| Extrato | ✅ | R$ 0 |
| Relatórios | ✅ | exports disponíveis |

#### PJ (`rh@centralmed.demo`)

| Seção | Status | Nota |
|-------|--------|------|
| Resumo | ✅ | contrato CentralMed |
| Beneficiários | ✅ | **Maria Silva Cedig** presente |
| Assinaturas / Faturas | ✅ | empty states claros |

#### Beneficiário (`maria.cedig@email.com`)

| Aba | Status |
|-----|--------|
| Resumo · Agendar · Agenda · Consumo · Faturas · Medicações · Exames · Plano · Assinatura | ✅ |
| Prontuário · Histórico | 🟡 nav ok; visitação parcial |

#### UX / UI / conteúdo

| Critério | Resultado |
|----------|-----------|
| Branding CEDIG (nome / teal) | ✅ |
| Labels MEDICAL (`Exame`, Beneficiário, Prestador) | ✅ |
| Tours de onboarding | 🟡 frequentes — ok em demo; pode cansar |
| Empty states | ✅ claros (greenfield) |
| Erros 500 / build | ✅ nenhum nesta rodada |
| Bugs bloqueantes | ✅ nenhum |

---

## Avaliação de prontidão para o cliente

### O que o dono pediu vs o que temos

| Pedido | Status |
|--------|--------|
| Secretária lança 1 linha/paciente sem fazer contas | ✅ `/interno/gestao` homologado |
| Despesas do mês | ✅ |
| KPIs automáticos (receita, lucro, produção, frascos, ticket) | ✅ |
| Menus e exemplos (médicos, exames, tabelas) | ✅ |
| Visão profissional para decisão | ✅ indicadores |

### Matriz de entrega

| Pacote | Pronto? | Comentário |
|--------|---------|------------|
| **A — Piloto gestão (Alana + admin)** | ✅ Sim | Core do pedido; homologado no browser |
| **B — Prestador (médicos)** | ✅ Ponte v2.6 | Agenda REALIZADO + extrato via ProcedureUsage |
| **C — PJ / Beneficiário** | ✅ Massa + labels | PJ×3 + PricingRules; Beneficiário Exame |
| **D — Produção white-label** | ⏳ | Deploy pacote v2.6 + modo **operação** |
| **E — Export Excel / ligação PPU** | ✅ v2.6 | Ver [`FASE_2.md`](FASE_2.md) |
| **F — E2E + dashboard KPIs gestão** | ✅ v2.6 | `e2e/cedig-gestao.spec.ts` |

### Veredito

**Pode entregar ao cliente o piloto de gestão clínica + pontes fase 2** (planilha → ferramenta + PPU/portais técnicos).

**Não vender ainda como “os 4 portais CEDIG em produção plena”** até homologação humana in loco e deploy do pacote.

### Checklist antes de mostrar ao cliente

1. Merge + deploy do pacote v2.6 (quando autorizar)
2. Modo **operação** + branding final (logo real, se houver)
3. Treinar Alana com [`ROTEIRO_HOMOLOGACAO.md`](ROTEIRO_HOMOLOGACAO.md) (15 min)
4. Validar ponte: lançamento → Prestador / Faturamento / PJ
5. Coletar feedback in loco

---

### 2026-07-25c — Correção das falhas mapeadas

Ver [`FALHAS.md`](FALHAS.md).

| ID | Correção |
|----|----------|
| P1-a | Prestador lista pacientes de agenda **ou** `ClinicExamLaunch` + seed com histórico |
| P1-b | Labels `useLabels()` na agenda/dashboard/pacientes do prestador (+ interno/atendimento) |
| P2-a | Removidos aliases `bruno@`/`luiza@` do select; demote no seed |
| P2-b | Select de pacientes cadastrados + `patientId` no lançamento |
| P2-c | Seed: 3 exames na agenda, 4 launches, 2 despesas |
| P3-a | Dismiss do tour principal bloqueia micro-tours |
| S2 | Empresa Dr Saúde no seed |

---

### 2026-07-26 — Mapeamento operacional 4 portais + agenda da semana

**Fonte canônica das ações:** [`ACOES_OPERACIONAIS.md`](ACOES_OPERACIONAIS.md) §4–§5.

| Item | Resumo |
|------|--------|
| Ambiente | `localhost:3000` · **operação** · `/?tenant=cedig` |
| Massa | 21 exames (semana) · 4 walk-ins · 4 lançamentos SYNCED · 2 despesas |
| Portais | Interno · Prestador · PJ · Beneficiário — todos ✅ |
| KPIs | Receita 11.750 · despesas 1.600 · lucro 10.150 |
| Scripts | `cedig-enrich-operation.ts` · `cedig-week-mapping.mjs` |
| Evidências | `/opt/cursor/artifacts/cedig-mapeamento/` |

Bugs bloqueantes: nenhum.
