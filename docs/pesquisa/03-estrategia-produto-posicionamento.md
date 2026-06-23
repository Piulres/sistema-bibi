# Sistema Bibi - ServiceOS — Estratégia Competitiva e Roadmap

---

## Posicionamento recomendado

O Sistema Bibi - ServiceOS é uma **infraestrutura horizontal Pay Per Use** que conecta empresas,
clientes finais e prestadores em múltiplos nichos (saúde, veterinária, odontologia,
jurídico, bem-estar e educação) — eliminando a **caixa preta da sinistralidade** e
permitindo cobrança baseada em uso real, com a mesma stack técnica para todos os verticais.

**ROI de referência:** empresa com 500 colaboradores — de ~R$ 175k/mês (modelo tradicional)
para ~R$ 23,4k/mês (Pay Per Use) = **~87% de economia**. Ver [`../plataforma/ROI_REFERENCIA.md`](../plataforma/ROI_REFERENCIA.md).

---

## Proposta de valor

### Para empresas

- Redução de desperdícios (~87% em cenário de referência — 15% utilização)
- Transparência financeira item a item
- Controle de utilização por colaborador/cliente
- Um contrato, múltiplos nichos de serviço (ServiceOS)

### Para beneficiários / clientes finais

- Autoatendimento
- Histórico de consumo
- Agendamento simples
- Preço transparente antes do atendimento

### Para prestadores

- Agenda
- Atendimento com registro de serviço
- Recebimento simplificado (snapshot de preço)

---

## Top 5 diferenciais

1. Arquitetura de **4 portais segregados** (estações de trabalho por perfil)
2. Pay Per Use nativo com congelamento de preço
3. Precificação dinâmica por empresa
4. White label + tema escuro + logos via Netlify Blobs
5. Plataforma multi-tenant **multi-nicho** (ServiceOS v2.0)

---

## Top 5 gaps

### Gap 1 — Prescrição digital regulada

- **Prioridade:** Alta
- **Sugestão:** Integração **Memed** (roadmap Q2)

### Gap 2 — WhatsApp Business API

- **Prioridade:** Alta
- **Automação:** lembretes, agendamentos, cobranças (roadmap Q1)

### Gap 3 — Copiloto clínico

- **Prioridade:** Média
- **Escopo:** IA para geração de SOAP

### Gap 4 — Motor de saúde populacional

- **Prioridade:** Média
- **Escopo:** Risco assistencial

### Gap 5 — Certificação SBIS

- **Prioridade:** Alta
- **Motivo:** Essencial para contratos enterprise (meta Q2–Q4)

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
| Conexa | Mais próxima da proposta transacional |
| Vitta | Saúde corporativa |
| Pipo Saúde | Benefícios corporativos |
| ERPMed | Referência arquitetural Pay Per Use |

---

## Roadmap 12 meses

### Q1

- **WhatsApp Business API** — lembretes, agendamento, cobrança
- PIX real (gateway de produção)
- Portal Beneficiário V2
- Início trilha **Certificação SBIS** (documentação e gaps)

### Q2

- **Integração Memed** — prescrição digital regulada
- **Certificação SBIS** — submissão PEP (meta)
- Telemedicina ampliada
- Assinatura digital ICP-Brasil

### Q3

- **Expansão comercial Vet, Dental e Legal** — tenants demo ServiceOS v2.0 (entregue na POC)
- IA SOAP
- IA resumo clínico
- Analytics multi-nicho

### Q4

- Saúde populacional
- **Certificação SBIS** — conclusão e contratos enterprise
- Marketplace de prestadores
- **SPA e Educação** — verticais bem-estar e capacitação corporativa

---

## Mensagem comercial

> Pare de pagar por vidas que não utilizam seu benefício.
>
> Com o Sistema Bibi - ServiceOS, sua empresa paga apenas pelo que foi efetivamente consumido —
> com transparência total para RH, clientes e prestadores. Até **~87% de economia**
> em empresas de médio porte.

---

## Pitch curto

Sistema Bibi - ServiceOS é uma infraestrutura SaaS multi-nicho que conecta empresas, clientes
e prestadores em uma única operação digital — de clínicas a escritórios de advocacia.

Diferente de ERPs verticais ou operadoras digitais, o Bibi oferece controle de consumo
individualizado, cobrança Pay Per Use e arquitetura multi-tenant white-label preparada
para escalar qualquer nicho de serviços profissionais.

---

Ver também: [`01-matriz-competitiva.md`](01-matriz-competitiva.md) · [`../segmentos/medical/pesquisa-expansao-2026.md`](../segmentos/medical/pesquisa-expansao-2026.md) (ROI, scripts RH/CFO) · [`../versoes/V2_0_ARCHITECTURE.md`](../versoes/V2_0_ARCHITECTURE.md)
