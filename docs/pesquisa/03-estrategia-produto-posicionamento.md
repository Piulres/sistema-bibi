# Sistema Bibi — Estratégia Competitiva e Roadmap

---

## Posicionamento recomendado

O Sistema Bibi é um **HealthOS para Saúde Corporativa Pay Per Use** — infraestrutura
financeira e clínica que conecta empresas, beneficiários e prestadores em um modelo
transparente de consumo. Não é corretora nem operadora: é o **sistema operacional**
sobre o qual RH, prestadores e pacientes capitalizam confiança, com o **Price
Snapshot** eliminando a “caixa preta” da sinistralidade.

---

## Regra 80/20 — foco da fase atual

| Alocação | Foco | Atividades |
|----------|------|------------|
| **80%** | Validação comercial brutal | Entrevistas e demos com **RHs e CFOs**; scripts de ROI; prova do Portal PJ em tempo real; objeções de sinistralidade e reajuste ANS |
| **20%** | Produto e engenharia | Price Snapshot, integrações críticas (Memed, WhatsApp), certificação SBIS, analytics |

> **Princípio:** não escalar features antes de fechar a narrativa financeira com
> quem aprova orçamento. Detalhes em
> [`09-sintese-consultor-senior.md`](09-sintese-consultor-senior.md) §3 e
> [`07-healthos-expansao-2026.md`](07-healthos-expansao-2026.md).

---

## Proposta de valor

### Para empresas (RH / CFO)

- Redução de custos fixos em até **~91%** no cenário 500 vidas (Pay Per Use vs capitação)
- Transparência financeira via Price Snapshot e Portal PJ
- Controle de utilização individualizado (fim da caixa preta)

### Para beneficiários

- Autoatendimento
- Histórico clínico
- Agendamento simples
- Preço conhecido antes do atendimento

### Para prestadores

- Agenda
- Atendimento
- Recebimento simplificado (uso registrado = preço congelado)

---

## Top 5 diferenciais

1. **HealthOS** — infraestrutura, não apenas gestão ou telemedicina
2. **Pay Per Use nativo** com Price Snapshot (`ProcedureUsage.priceCharged`)
3. Precificação dinâmica por empresa (`PricingRule`)
4. Arquitetura de 4 portais segregados (capitalização independente por ator)
5. Plataforma multi-tenant white-label

---

## Top 5 gaps

### Gap 1 — Prescrição digital regulada

- **Prioridade:** Alta
- **Sugestão:** Integração **Memed** (Q2)
- **Roadmap:** ver Q2 abaixo

### Gap 2 — WhatsApp Business API

- **Prioridade:** Alta
- **Automação:** lembretes, agendamentos, cobranças
- **Roadmap:** ver Q1 abaixo

### Gap 3 — Copiloto clínico

- **Prioridade:** Média
- **Escopo:** IA para geração de SOAP

### Gap 4 — Motor de saúde populacional

- **Prioridade:** Média
- **Escopo:** Risco assistencial · monetização Analytics Premium

### Gap 5 — Certificação SBIS (PEP e Telessaúde)

- **Prioridade:** Alta (requisito **enterprise**)
- **Escopo:** PEP + módulo Telessaúde para RFPs de grandes empresas
- **Meta:** Q3/Q4 do roadmap de 12 meses

---

## Empresas que não devemos enfrentar diretamente

| Player | Motivo |
|--------|--------|
| Tasy | Mercado hospitalar enterprise |
| MV | Mercado hospitalar enterprise |
| Benner | ERP corporativo complexo |
| Philips | Enterprise internacional |

---

## Empresas que devemos enfrentar

| Player | Motivo |
|--------|--------|
| Conexa | Telemedicina + B2B — competidor de serviço, não de infraestrutura |
| Vitta | Saúde corporativa — corretora/gestão de benefícios |
| Pipo Saúde | Benefícios corporativos — modelo de corretagem |
| ERPMed | Referência arquitetural de ERP clínico |

Ver matriz detalhada: [`01-matriz-competitiva.md`](01-matriz-competitiva.md)

---

## Roadmap 12 meses

### Q1 — receita e engajamento

- PIX real (gateway de produção)
- **WhatsApp Business API** (lembretes, cobrança, confirmação de agenda)
- Portal Beneficiário V2

### Q2 — interoperabilidade clínica

- **Memed** (prescrição digital no Portal Prestador)
- Telemedicina (salas + fluxo assinatura)
- Assinatura digital de documentos clínicos

### Q3 — inteligência e analytics

- IA SOAP
- IA resumo clínico
- Analytics · base do **Analytics Premium** ([`../MONETIZACAO.md`](../MONETIZACAO.md))

### Q4 — enterprise e rede

- Saúde populacional (motor de risco assistencial)
- **Certificação SBIS** (PEP + Telessaúde)
- Marketplace de prestadores

---

## Mensagem comercial

> Pare de pagar por vidas que não utilizam seu benefício de saúde.
>
> O Bibi é um HealthOS: sua empresa paga apenas pelo que realmente foi utilizado,
> com preço congelado no ato do atendimento (**Price Snapshot**) e transparência
> total para RH, beneficiários e prestadores.

---

## Pitch curto

Sistema Bibi é um **HealthOS para Saúde Corporativa Pay Per Use** — infraestrutura
que conecta empresas, beneficiários e prestadores em uma única operação digital.

Diferente de ERPs clínicos, corretoras (Pipo, Vitta) ou serviços de telemedicina
(Conexa), o Bibi é o **sistema operacional**: controle de consumo individualizado,
cobrança por uso real, Price Snapshot anti-sinistralidade e arquitetura multi-tenant
white-label para escalar redes de saúde corporativa.

---

Ver também: [`01-matriz-competitiva.md`](01-matriz-competitiva.md) ·
[`07-healthos-expansao-2026.md`](07-healthos-expansao-2026.md) (ROI, scripts RH/CFO) ·
[`09-sintese-consultor-senior.md`](09-sintese-consultor-senior.md) ·
[`../MONETIZACAO.md`](../MONETIZACAO.md) ·
[`../BENCHMARK.md`](../BENCHMARK.md) (gaps técnicos na POC)
