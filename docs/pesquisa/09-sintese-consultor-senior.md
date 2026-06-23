# Síntese Executiva — ServiceOS segmento saúde

**Sistema Bibi - ServiceOS · Pay Per Use · Saúde corporativa 2026**

> Documento do vertical `MEDICAL`. Marca canônica v2.0: **ServiceOS** (v1.x usava codinome *HealthOS*).

| Meta | Valor |
|------|-------|
| Versão | 1.0 |
| Data | Junho/2026 |
| Documento detalhado | [`../segmentos/medical/pesquisa-expansao-2026.md`](../segmentos/medical/pesquisa-expansao-2026.md) |

Análise integrada de **dados de mercado**, **projeções financeiras** e **mapeamento técnico**, com separação explícita entre **FATO** e **INFERÊNCIA**.

---

## 1. ROI comparativo — eficiência financeira (500 vidas)

Transição do modelo de **capitação** (pagar por vida) para **Pay Per Use** do Bibi.

### Tabela executiva (cenário comercial recomendado)

| Dimensão financeira | Plano digital tradicional (mercado) | Sistema Bibi - ServiceOS (Pay Per Use) |
|---------------------|-------------------------------------|----------------------------|
| Modelo de cobrança | Mensalidade fixa por colaborador | Pagamento por utilização efetiva |
| Custo mensal por vida/uso | R$ 350,00 (ticket médio PME) | R$ 153,00 (preço com desconto corporativo) |
| Base de cálculo (mensal) | 500 vidas ativas | 75 atendimentos (15% de uso) |
| Custo fixo de software | Já incluso na mensalidade | R$ 3.000,00 (taxa plataforma est.) |
| **Total mensal** | **R$ 175.000,00** | **R$ 14.475,00** |
| **Economia mensal / anual** | — | **R$ 160.525,00 / R$ 1,92 mi** |
| **Economia %** | — | **~91,7%** |

**FATO:** O modelo tradicional cobra independentemente da utilização, gerando desperdício em vidas ociosas.

**FATO:** O Bibi utiliza **Price Snapshot** — `priceCharged` congela o valor no ato do atendimento após `computePrice()` + `PricingRule.multiplier` ([`src/lib/pricing.ts`](../../src/lib/pricing.ts)).

**INFERÊNCIA:** Redução de custos de ~91% é o principal gatilho de aprovação do CFO em empresas de médio porte (100–1.000 colaboradores), desde que o escopo (ambulatorial vs internação) esteja alinhado.

**FATO (demo):** TechCorp no seed usa `clinicalDiscount: 0.85` — desconto corporativo de 15% aplicado via multiplier ([`prisma/seed-data/companies.ts`](../../prisma/seed-data/companies.ts)).

> Detalhamento: sensibilidade 5%–100%, break-even e cenário sem taxa de plataforma em [`../segmentos/medical/pesquisa-expansao-2026.md`](../segmentos/medical/pesquisa-expansao-2026.md) §1.

---

## 2. Interoperabilidade e roadmap de certificação

Para atingir mercado **enterprise**, o Bibi evolui de plataforma de gestão para **nó central do ecossistema de saúde**.

### Gaps técnicos prioritários

| Integração | Objetivo | Status POC |
|------------|----------|:----------:|
| **Memed** (prescrição digital) | Validade jurídica das receitas no Portal Prestador; fim de prescrição manual | ❌ |
| **WhatsApp Business API** | Lembretes de agenda, alertas de faturamento, engajamento beneficiário | 🟡 mock (`COMMUNICATIONS.md`) |
| **TISS/ANS** | XML real para interoperabilidade com operadoras e auditorias | 🟡 mock (`tiss-service.ts`) |

**FATO:** Memed integra via API/widget no fluxo do atendimento — ver etapas em doc 07 §2.1.

**FATO:** Motor de comunicação já prevê `WhatsAppProvider` em Strategy Pattern ([`docs/COMMUNICATIONS.md`](../../docs/COMMUNICATIONS.md)).

### Certificação SBIS PEP

| Aspecto | Conteúdo | Tipo |
|---------|----------|------|
| Impacto | Essencial para RFPs de grandes empresas e hospitais que exigem segurança e validade jurídica do PEP | INFERÊNCIA |
| Prazo (12 meses) | Priorizar **Q3/Q4** do roadmap para sustentar expansão ao SAM (~50 mil empresas) | INFERÊNCIA |
| Table stakes 2026 | SBIS + LGPD no topo da pirâmide enterprise | **FATO** mercado |

**INFERÊNCIA:** Sem Memed e WhatsApp, o Bibi perde competitividade na camada SMB frente a iClinic e Feegow — mesmo competindo em B2B corporativo.

---

## 3. Script de validação comercial (RH e CFO)

Foco: destruir a **“caixa preta”** da sinistralidade via **Portal PJ**.

### Roteiro “Validação Brutal”

| Etapa | Script | Tipo |
|-------|--------|------|
| **O gancho (dor)** | “Seu plano reajustou ~20% este ano e você não sabe exatamente por quê, certo?” | INFERÊNCIA (reajuste ANS típico) |
| **O diferencial** | “O ServiceOS cobra só pelo que seus funcionários usam, com preço congelado no ato (**Price Snapshot**).” | FATO produto + INFERÊNCIA posicionamento |
| **A demonstração (Portal PJ)** | “Aqui você vê em tempo real quem usou, qual procedimento e o desconto corporativo aplicado pela **Precificação Dinâmica**.” | **FATO** (`/pj`, `pj-portal-service.ts`) |
| **A pergunta de R$ 10 milhões** | “Quanto de economia garantida nos dados você precisa ver para substituir parte do custo fixo por este modelo sob demanda?” | INFERÊNCIA fechamento |

**FATO:** Empresas reclamam de falta de transparência e reajustes opacos (benchmark mercado em [`02-analise-mercado.md`](02-analise-mercado.md)).

**FATO:** Bibi possui **4 portais segregados** (prestador, interno, PJ, beneficiário).

**INFERÊNCIA:** A venda depende de convencer o CFO de que o risco de alta utilização é menor que o custo fixo da ineficiência atual.

> Perguntas de diagnóstico, objeções e piloto 90 dias: [`../segmentos/medical/pesquisa-expansao-2026.md`](../segmentos/medical/pesquisa-expansao-2026.md) §3.

---

## 4. Inteligência competitiva — Tier 1

O Bibi **não compete por agenda** — compete por **gestão inteligente de consumo**.

**FATO:** Conexa, Vitta e Pipo são os concorrentes mais próximos (**75%–85%** de similaridade) — ver [`01-matriz-competitiva.md`](01-matriz-competitiva.md).

### Matriz estratégica

| Funcionalidade | Sistema Bibi - ServiceOS | Pipo / Vitta / Conexa |
|----------------|:------------:|:---------------------:|
| Core business | ServiceOS Pay Per Use | Gestão de benefícios / telessaúde |
| Precificação dinâmica | Multiplicador por empresa nativo (`PricingRule`) | Tabelas de rede fixas / corretagem |
| Transparência de uso | Portal PJ + Timeline universal | Relatórios sinistralidade (mensais/posteriores) |
| Snapshot de preço | Sim — congela no uso (`priceCharged`) | Não — sujeito a glosa/ajuste posterior |
| Arquitetura | 4 portais segregados | Geralmente 2 ou 3 portais |

### Pontos estratégicos

**Vantagem da precificação dinâmica (INFERÊNCIA):** Enquanto Tier 1 opera com tabelas estáticas e reajuste anual, o RH negocia pacotes por empresa; o sistema aplica descontos automaticamente — ex. **15% TechCorp** (`multiplier: 0.85` no seed).

**Análise populacional (FATO + INFERÊNCIA):**

| Fonte de dado | Bibi | Pipo / corretoras |
|---------------|------|-------------------|
| Origem | Primária — PEP e `ProcedureUsage` no ato | Secundária — dados das operadoras |
| Latência | Evento em tempo real | Relatórios periódicos |
| Granularidade | CPF + procedimento + valor | Sinistro agregado |

**INFERÊNCIA:** Janela de oportunidade para o Bibi como **“SaaS de infraestrutura”** white-label para redes e corretoras — não apenas competidor head-on.

---

## 5. Conclusão do consultor

| Pilar | Mensagem |
|-------|----------|
| Financeiro | Pague pelo uso; economia ~92% no cenário 500 vidas / 15% utilização |
| Operacional | 4 portais + Price Snapshot + Portal PJ transparente |
| Estratégico | ServiceOS entre ERP clínico e operadora digital — infraestrutura Pay Per Use |

**Próximo passo recomendado (INFERÊNCIA):** Piloto 90 dias com 1 empresa 100–500 vidas; medir utilização real vs contrafactual R$ 350/vida; validar gancho CFO com planilha desta síntese.

---

*Síntese executiva — complementa [`../segmentos/medical/pesquisa-expansao-2026.md`](../segmentos/medical/pesquisa-expansao-2026.md). Não substitui due diligence comercial.*
