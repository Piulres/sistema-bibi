# Sistema Bibi — Análise de Mercado

**HealthTech SaaS Brasil 2026**

---

## Visão geral

O mercado brasileiro de saúde movimenta mais de R$ 800 bilhões anuais.

A transformação digital acelerou após:

- LGPD
- Telemedicina permanente
- PIX
- Escassez de profissionais
- Pressão de custos corporativos

---

## Tendências 2025–2026

### Table stakes

Itens que deixaram de ser diferenciais:

- Agenda online
- Telemedicina
- Aplicativo mobile
- Assinatura digital
- PIX
- WhatsApp
- Prescrição digital
- Dashboard operacional

Todo fornecedor relevante já oferece isso.

### Diferenciais emergentes

#### IA assistencial

- Transcrição automática
- Geração de SOAP
- Resumo clínico
- Copiloto médico

#### Gestão populacional

- Score de risco
- Predição de sinistralidade
- Identificação de pacientes críticos

#### Saúde corporativa

Empresas estão migrando de **"plano de saúde"** para **"gestão de saúde"**.

#### Pay Per Use

Tendência crescente. Empresas desejam:

- Previsibilidade
- Auditoria
- Redução de desperdícios

---

## Fusões e aquisições relevantes

### Afya

Aquisição e consolidação de:

- iClinic
- Cliquefarma
- RX Pro

**Objetivo:** construir ecossistema médico completo.

### MV

Expansão do ecossistema digital hospitalar.

### Philips

Integração de soluções hospitalares e interoperabilidade.

### Bionexo

Expansão da plataforma hospitalar (incl. Tasy).

---

## HealthTechs com captação relevante

| Player | Destaque |
|--------|----------|
| **Alice** | Maior destaque do segmento |
| **Sami** | Captações expressivas para expansão nacional |
| **Conexa** | Investimentos em infraestrutura digital |
| **Pipo Saúde** | Forte crescimento em benefícios corporativos |
| **Vitta** | Expansão da vertical corporativa |

---

## Faixas de preço

| Segmento | Faixa (referência) |
|----------|-------------------|
| Médico individual | R$ 99 a R$ 350 |
| Clínica pequena | R$ 300 a R$ 1.500 |
| Clínica média | R$ 1.500 a R$ 8.000 |
| Hospital | Projetos entre dezenas e centenas de milhares de reais |

### Consultas ambulatoriais (benchmark 2026)

O mercado corporativo privado convergiu para tickets mais altos que a referência
histórica de ~R$ 180/consulta:

| Tipo | Faixa padrão (2026) | Exemplo no seed Bibi |
|------|---------------------|----------------------|
| Clínica geral | R$ 300 – R$ 400 | Consulta Clínica **R$ 400** (`CON-CLM`) |
| Especialistas | R$ 400 – R$ 500 | Cardiologia **R$ 500**, Dermatologia **R$ 450** |
| Psicologia / base | R$ 300 – R$ 350 | Psicologia **R$ 300**, Oftalmologia **R$ 420** |

Fonte de dados demo: [`prisma/seed-data/pricing-market.ts`](../prisma/seed-data/pricing-market.ts).

### Precificação dinâmica corporativa (`PricingRule`)

O preço de tabela (`Procedure.basePrice`) é ajustado por empresa via
`PricingRule.multiplier` no momento do atendimento (`computePrice()` em
`src/lib/pricing.ts`):

```
preço efetivo = basePrice × multiplier
```

**Exemplo TechCorp:** consulta clínica base **R$ 400** × multiplier **0,85**
(desconto 15%) = **R$ 340** congelado em `ProcedureUsage.priceCharged`.

Isso permite ao RH negociar descontos por contrato sem perder auditoria: cada
evento de uso carrega o preço aplicado naquele atendimento, visível no Portal PJ.

---

## Certificações mais solicitadas

### Obrigatórias ou quase obrigatórias

- LGPD
- ICP-Brasil
- TISS

### Fortemente desejadas

- SBIS PEP
- SBIS Prescrição
- ISO 27001
- SOC2

---

## Conclusão

O mercado está migrando para plataformas integradas.

O maior espaço competitivo atual está entre **ERP clínico tradicional** e
**operadoras digitais**. O Sistema Bibi posiciona-se nesse intervalo como
**HealthOS**, com SOM inicial de **~5 mil empresas** (100–1.000 colaboradores)
e tickets de consulta alinhados ao mercado 2026 (R$ 300–500).

---

Ver também: [`04-visao-executiva.md`](04-visao-executiva.md) · [`01-matriz-competitiva.md`](01-matriz-competitiva.md)
