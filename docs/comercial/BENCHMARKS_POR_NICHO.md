# Benchmarks por nicho — ServiceOS v2.0

Catálogo consolidado de **concorrentes, features, prós/contras e âncoras de preço** por vertical. Complementa [`../pesquisa/01-matriz-competitiva.md`](../pesquisa/01-matriz-competitiva.md) e as pesquisas em `docs/segmentos/*/pesquisa.md`.

> **Política:** coluna **ServiceOS** = FATO (código/seed). Demais players = **INFERÊNCIA** estratégica — validar em due diligence. Última revisão: junho/2026.

---

## Legenda

| Símbolo | Significado |
|---------|-------------|
| ✅ | Forte / implementado |
| 🟡 | Parcial ou depende de plano |
| ❌ | Ausente ou fraco |
| ⭐ | Diferencial ServiceOS |

---

## 1. Saúde (`MEDICAL`)

### Concorrentes principais

| Player | Modelo | Preço âncora | Público |
|--------|--------|--------------|---------|
| **Conexa** | Saúde digital B2B | R$ 19,90–45,99/vida/mês (PME) | Empresas 20+ vidas |
| **Vitta** | Saúde corporativa + rede | Sob consulta | Médio/grande porte |
| **Pipo Saúde** | Benefícios flexíveis | Por vida/mês | PME |
| **Alice** | Operadora digital | Assinatura por vida | PME/startup |
| **iClinic / Feegow** | ERP clínica | R$ 99–400/mês clínica | Prestador (não B2B transacional) |
| **ERPMed** | Pay Per Use saúde corp. | Enterprise | Referência arquitetural |

**Fontes web (jun/2026):** [Conexa PME](https://site.conexasaude.com.br/site/pme-planos) · [Conexa empregadores](https://www.conexasaude.com.br/para-empregadores)

### Matriz de features

| Critério | ServiceOS | Conexa | Vitta | iClinic | ERPMed |
|----------|:---------:|:------:|:-----:|:-------:|:------:|
| Pay Per Use nativo | ⭐✅ | 🟡 | 🟡 | ❌ | ✅ |
| Portal PJ (RH) | ⭐✅ | ✅ | ✅ | ❌ | ✅ |
| Portal prestador | ⭐✅ | 🟡 | 🟡 | ✅ | 🟡 |
| Price Snapshot | ⭐✅ | ❌ | 🟡 | ❌ | ✅ |
| Multi-nicho | ⭐✅ | ❌ | ❌ | ❌ | ❌ |
| Telemedicina | 🟡 | ✅ | ✅ | ✅ | ✅ |
| TISS / ANS | 🟡 | 🟡 | ❌ | ✅ | ✅ |
| White label | ⭐✅ | 🟡 | 🟡 | ❌ | ✅ |

### Prós e contras — ServiceOS vs mercado

| Prós ServiceOS | Contras ServiceOS (honestos) |
|----------------|------------------------------|
| Transparência item a item (anti caixa-preta) | Menos profundidade clínica que iClinic |
| ROI modelado ~87% (500 vidas, 15% uso) | PIX/TISS/WhatsApp ainda mock/parcial |
| 4 portais + precificação por empresa | Sem rede credenciada nacional própria |
| Mesma stack para 6 nichos | Sem app nativo paciente |
| API + webhooks enterprise | SBIS / Memed em roadmap |

### Posicionamento

**Competir com:** Conexa, Vitta, Pipo, ERPMed (transacional B2B).  
**Não competir com:** Tasy, MV (hospitalar).

---

## 2. Veterinária (`VET`)

### Concorrentes principais

| Player | Modelo | Preço âncora | Público |
|--------|--------|--------------|---------|
| **Guapeco** | Reembolso benefício pet B2B | Por uso reembolsado | RH |
| **People Pet** | Plano pet empresas | Mensalidade | Corporativo |
| **Petlove / DogHero** | Assinatura B2C | R$ 80–200/mês pet | Tutor |
| **Vetus / SimplesVet** | ERP clínica vet | SaaS mensal | Clínica |
| **Hashiko** | ERP pet shop | SaaS | Banho/tosa |

### Matriz de features

| Critério | ServiceOS | Guapeco | Vetus | Petlove |
|----------|:---------:|:-------:|:-----:|:-------:|
| Pay Per Use | ⭐✅ | 🟡 | ❌ | ❌ |
| Portal tutor self-service | ⭐✅ | 🟡 | ❌ | ✅ |
| Portal PJ | ⭐✅ | 🟡 | ❌ | ❌ |
| Módulo Pet (`Pet` entity) | ⭐✅ | ❌ | 🟡 | 🟡 |
| Price Snapshot | ⭐✅ | ❌ | ❌ | ❌ |
| Carteira vacinal | ✅ | ❌ | ✅ | 🟡 |
| White label rede | ⭐✅ | ❌ | ❌ | ❌ |

### Prós e contras

| Prós | Contras |
|------|---------|
| Tutor + pet + faturamento unificado | Sem marketplace B2C (Petlove) |
| Auxílio pet auditável pelo RH | Integração reembolso operadoras — roadmap |
| Banho/tosa + clínica no mesmo motor | Menos profundidade ERP que Vetus |

**TAM FATO:** mercado pet ~R$ 78 bi (2025, Abempet). Ver [`../segmentos/vet/pesquisa.md`](../segmentos/vet/pesquisa.md).

---

## 3. Odontologia (`DENTAL`)

### Concorrentes principais

| Player | Modelo | Preço âncora | Público |
|--------|--------|--------------|---------|
| **Odontoprev / MetLife** | Operadora odonto | R$ 20–120/vida/mês | Benefício corp. |
| **Dental Uni / Interodonto** | Cooperativa | Mensalidade | Rede |
| **Clinicorp / Dental Office** | SaaS clínica | R$ 150–400/mês | Consultório |
| **iClinic / Feegow** | ERP + odonto | SaaS | Clínica |
| **DentMap** | Marketplace agendamento | Por agendamento | B2C |

### Matriz de features

| Critério | ServiceOS | Odontoprev | Clinicorp | iClinic |
|----------|:---------:|:----------:|:---------:|:-------:|
| Pay Per Use | ⭐✅ | ❌ | ❌ | ❌ |
| Portal PJ | ⭐✅ | 🟡 | ❌ | ❌ |
| Odonto corporativo transparente | ⭐✅ | ❌ | ❌ | ❌ |
| Agenda + faturamento integrado | ✅ | ❌ | ✅ | ✅ |
| TISS odonto | 🟡 | ✅ | 🟡 | ✅ |

### Prós e contras

| Prós | Contras |
|------|---------|
| Odonto table stakes sem mensalidade ociosa | Sem carteirinha operadora |
| Economia 50–70% em baixa utilização **INFERÊNCIA** | Sem odontograma visual |
| Bundle possível com vertical saúde | Rede credenciada a construir |

---

## 4. Jurídico (`LEGAL`)

### Concorrentes principais

| Player | Modelo | Preço âncora | Público |
|--------|--------|--------------|---------|
| **Astrea (Aurum)** | Gestão jurídica | ~R$ 149/mês | Escritório |
| **ADVBox** | LegalTech | ~R$ 89/mês | Pequeno porte |
| **Projuris ADV** | Enterprise jurídico | Sob consulta | Médio/grande |
| **EasyJur** | Gestão + financeiro | Variável | Escritório |
| **LegalSuite** | IA contratos | ~R$ 197/mês | Boutique |

### Matriz de features

| Critério | ServiceOS | Astrea | ADVBox | Projuris |
|----------|:---------:|:------:|:------:|:--------:|
| Hora técnica + Price Snapshot | ⭐✅ | 🟡 | ✅ | ✅ |
| Portal cliente corporativo | ⭐✅ | ❌ | 🟡 | 🟡 |
| Pay Per Use B2B | ⭐✅ | ❌ | ❌ | ❌ |
| Gestão processual contencioso | ❌ | ✅ | ✅ | ✅ |
| Timesheet | 🟡 | 🟡 | ✅ | ✅ |
| White label | ⭐✅ | ❌ | ❌ | 🟡 |

### Prós e contras

| Prós | Contras |
|------|---------|
| Fim da disputa de honorários (preço congelado) | Sem PJe / tribunais |
| Retainer + uso real no mesmo motor | Sem IA de contratos (LegalSuite) |
| Dept. jurídico audita horas por área | Contencioso profundo — não escopo |

**FATO mercado:** ~22% receita perdida em horas não faturadas (citação setor). Ver [`../segmentos/legal/pesquisa.md`](../segmentos/legal/pesquisa.md).

---

## 5. Bem-estar (`SPA`)

### Concorrentes principais

| Player | Modelo | Preço âncora | Público |
|--------|--------|--------------|---------|
| **Wellhub (Gympass)** | Assinatura wellness | R$ 35–70/colab/mês (empresa) | RH |
| **TotalPass** | Assinatura fitness | Similar | Corporativo |
| **Buddha Spa** | Franquia + corp. | Vouchers / in loco | Empresas |
| **Zenklub / Vittude** | EAP saúde mental | Assinatura | RH |
| **ClassPass** | Créditos aulas | Por crédito | B2C/B2B |

**Fontes web (jun/2026):** [Wellhub empresas](https://wellhub.com/pt-br/companies/) · estimativa R$ 35–70/colab ([F24](https://f24.com.br/quanto-custa-gympass-para-empresa/))

### Matriz de features

| Critério | ServiceOS | Wellhub | Buddha Spa | Zenklub |
|----------|:---------:|:-------:|:----------:|:-------:|
| Paga por sessão utilizada | ⭐✅ | ❌ | 🟡 voucher | ❌ |
| Portal PJ consumo | ⭐✅ | 🟡 dashboard | ❌ | 🟡 |
| Spa + yoga + massagem credenciados | ✅ | 🟡 rede ampla | ✅ | ❌ |
| NR-1 / saúde mental | 🟡 | ✅ | 🟡 | ✅ |
| Price Snapshot | ⭐✅ | ❌ | ❌ | ❌ |

### Prós e contras

| Prós | Contras |
|------|---------|
| ~70% economia em baixa adesão **INFERÊNCIA** | Rede menor que Wellhub |
| Sessão auditável (massagem, yoga) | Sem app marketplace massivo |
| Quick massage in company — modelo Buddha | EAP integrado — parceria, não produto |

**TAM FATO:** wellness corp. US$ 1,6 bi Brasil 2025 (IMARC). Ver [`../segmentos/spa/pesquisa.md`](../segmentos/spa/pesquisa.md).

---

## 6. Educação (`EDUCATION`)

### Concorrentes principais

| Player | Modelo | Preço âncora | Público |
|--------|--------|--------------|---------|
| **Udemy Business** | Assinatura L&D | ~R$ 30–80/colab/mês | Empresa |
| **Coursera for Business** | Licenças | Por assento | Enterprise |
| **Alura / Pluralsight** | Assinatura tech | Mensal | L&D |
| **Hotmart** | Marketplace infoproduto | 9,9% + R$ 1/venda | Criador |
| **Superprof** | Marketplace aula | Por hora | B2C |

### Matriz de features

| Critério | ServiceOS | Udemy Business | Hotmart | Superprof |
|----------|:---------:|:--------------:|:-------:|:---------:|
| Crédito por aula realizada | ⭐✅ | ❌ | 🟡 | ✅ |
| Portal PJ L&D | ⭐✅ | 🟡 | ❌ | ❌ |
| Mentoria 1:1 faturável | ⭐✅ | ❌ | 🟡 | ✅ |
| Catálogo gravado (LMS) | ❌ | ✅ | ✅ | ❌ |
| Price Snapshot | ⭐✅ | ❌ | ❌ | ❌ |

### Prós e contras

| Prós | Contras |
|------|---------|
| Fim do "shelfware" (licença ociosa) | Sem LMS / SCORM completo |
| Mentoria auditável pelo RH | Sem marketplace de creators |
| Instrutor local credenciado | Catálogo menor que Udemy |

**INFERÊNCIA:** 200 cols × R$ 50 Udemy = R$ 10k/mês vs. 30 aulas × R$ 150 = R$ 4,5k.

---

## 7. Síntese transversal — ServiceOS vs todos

### Onde ganhamos (⭐)

1. Pay Per Use + Price Snapshot nativos  
2. Quatro portais segregados com dados unificados  
3. Multi-nicho na mesma infraestrutura  
4. Precificação dinâmica por empresa (Portal PJ)  
5. White label por tenant  
6. API REST + webhooks com retry  

### Onde perdemos (honestidade comercial)

1. Profundidade vertical (clínica, processual, LMS)  
2. Rede credenciada / marketplace nacional  
3. Integrações reguladas em produção (TISS XSD, Memed, WhatsApp API)  
4. App mobile nativo  
5. Certificações enterprise (SBIS) — roadmap  
6. IA assistencial vs. Conexa/Alice  

### Matriz decisão de compra

| Buyer pergunta | Resposta ServiceOS |
|----------------|-------------------|
| "Quero pagar só pelo usado?" | ✅ Core do produto |
| "RH precisa auditar consumo?" | ✅ Portal PJ |
| "Preciso da minha marca?" | ✅ White label |
| "Atendo só um nicho?" | ✅ Landing + labels dedicados |
| "Preciso ERP hospitalar?" | ❌ Não é o produto |
| "Preciso 5.000 médicos na rede?" | ❌ Construir credenciamento |

---

## Referências

| Documento | Conteúdo |
|-----------|----------|
| [`MODULOS_COMUNS.md`](MODULOS_COMUNS.md) | Features compartilhadas |
| [`ESTRATEGIA_SEGMENTOS.md`](ESTRATEGIA_SEGMENTOS.md) | Técnicas por nicho |
| [`../plataforma/BENCHMARK.md`](../plataforma/BENCHMARK.md) | Matriz técnica POC |
| [`../segmentos/README.md`](../segmentos/README.md) | Pesquisa por vertical |

*Benchmarks de mercado — revisar trimestralmente ou antes de RFP.*
