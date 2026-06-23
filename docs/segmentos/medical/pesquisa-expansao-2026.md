# Sistema Bibi - ServiceOS — Expansão segmento saúde 2026

**Consultoria estratégica:** posicionamento **ServiceOS** no vertical `MEDICAL` (saúde corporativa)

> **Arquivo histórico v1.x:** redigido quando o codinome interno era *HealthOS*. Mantido para ROI e scripts comerciais do segmento saúde; novos desenvolvimentos usam a marca **ServiceOS v2.0**.

| Meta | Valor |
|------|-------|
| Versão | 1.1 |
| Data | Junho/2026 |
| Stack POC | Next.js 16, React 19, Prisma 6 |
| Diferencial técnico | **Price Snapshot** (`priceCharged` congelado no ato do atendimento via `computePrice` + `PricingRule`) |

**Legenda em todo o documento**

| Tag | Significado |
|-----|-------------|
| **FATO** | Dado público, implementado na POC ou premissa explícita do modelo |
| **INFERÊNCIA** | Projeção estratégica — validar em pilotos comerciais |

---

## 1. Análise de ROI comparativa

### 1.1 Premissas do modelo

| Variável | Valor | Tipo |
|----------|-------|------|
| Colaboradores elegíveis | 500 | INFERÊNCIA (cenário pedido) |
| Plano digital tradicional (por vida) | R$ 350,00/mês/colaborador | INFERÊNCIA (benchmark mercado médio) |
| Consulta Pay Per Use Bibi | R$ 272,00/consulta | **FATO** (seed: `CON-CLM` R$ 320 × 0,85 TechCorp) |
| Taxa de utilização | 15% | INFERÊNCIA (premissa do exercício) |
| Price Snapshot Bibi | Preço travado no registro do procedimento | **FATO** (`ProcedureUsage.priceCharged`) |

**FATO:** No Bibi, o valor cobrado não “muda depois” — `computePrice()` aplica `PricingRule.multiplier` por empresa no momento do atendimento e persiste em `priceCharged`.

**INFERÊNCIA:** O plano “por vida” cobra independentemente de uso; o Bibi cobra por evento assistencial. A comparação só é justa se ambos cobrirem escopo clínico equivalente (consultas primárias, não internação).

---

### 1.2 Cenário base — 500 colaboradores, 15% de utilização mensal

**Interpretação da utilização:** 15% dos colaboradores realizam **1 consulta no mês** (75 consultas/mês).

#### Cenário comercial recomendado (uso + taxa plataforma)

| Indicador | Plano por vida | Bibi Pay Per Use | Δ |
|-----------|----------------|------------------|---|
| Uso variável | 500 × R$ 350 | 75 × R$ 272 = R$ 20.400 | — |
| Taxa plataforma | Inclusa na mensalidade | R$ 3.000 | — |
| **Custo mensal total** | **R$ 175.000** | **R$ 23.400** | **−R$ 151.600** |
| **Custo anual** | **R$ 2.100.000** | **R$ 280.800** | **−R$ 1.819.200** |
| **Economia %** | — | — | **~86,6%** |

#### Cenário uso puro (sem taxa plataforma — sensibilidade)

| Indicador | Plano por vida | Bibi (só eventos) | Δ |
|-----------|----------------|-------------------|---|
| **Custo mensal** | **R$ 175.000** | **R$ 20.400** | **−R$ 154.600** |
| **Economia %** | — | — | **~88,3%** |

\* *INFERÊNCIA:* Custo efetivo por consulta no modelo fixo: R$ 175.000 ÷ 75 ≈ **R$ 2.333/consulta** quando só 15% usam.

**INFERÊNCIA (mensagem CFO):** No modelo fixo, os 85% que não usam subsidiam os 15% que usam. No Pay Per Use, o caixa acompanha a demanda real. Use **R$ 23.400/mês** (com taxa plataforma) em propostas comerciais — ver [`09-sintese-consultor-senior.md`](../../pesquisa/09-sintese-consultor-senior.md) e [`../../plataforma/ROI_REFERENCIA.md`](../../plataforma/ROI_REFERENCIA.md).

---

### 1.3 Análise de sensibilidade — utilização mensal (1 consulta/usuário ativo)

| Utilização | Usuários ativos/mês | Consultas/mês | Custo Bibi/mês* | Economia vs R$ 175k | Economia % |
|:--------:|:-------------------:|:-------------:|:---------------:|:-------------------:|:----------:|
| 5% | 25 | 25 | R$ 9.800 | R$ 165.200 | 94,4% |
| 10% | 50 | 50 | R$ 16.600 | R$ 158.400 | 90,5% |
| **15%** | **75** | **75** | **R$ 23.400** | **R$ 151.600** | **86,6%** |
| 25% | 125 | 125 | R$ 37.000 | R$ 138.000 | 78,9% |
| 40% | 200 | 200 | R$ 57.400 | R$ 117.600 | 67,2% |
| 60% | 300 | 300 | R$ 84.600 | R$ 90.400 | 51,7% |
| 100% | 500 | 500 | R$ 139.000 | R$ 36.000 | 20,6% |

\* *Inclui taxa plataforma R$ 3.000/mês + consultas a R$ 272 (preço congelado).*

**FATO (matemática):** Ponto de equilíbrio mensal (só variável, sem taxa plataforma):  
`175.000 ÷ 272 ≈ 644 consultas/mês` → **~129% de “vida-consulta”** sobre 500 vidas (todos precisariam de ~1,3 consultas/mês em média).

**INFERÊNCIA:** Pay Per Use vence em caixa enquanto a utilização real permanecer abaixo do break-even — típico em programas de atenção primária corporativa (ANS: utilização ambulatorial frequentemente &lt; 40% da carteira em modelos mistos).

---

### 1.4 Cenário anual (utilização 15% — 1 consulta/ano por usuário ativo)

| Indicador | Plano por vida (12 meses) | Bibi (75 consultas/ano) |
|-----------|---------------------------|-------------------------|
| Uso variável anual | R$ 2.100.000 | 75 × R$ 272 = **R$ 20.400** |
| Taxa plataforma (12 meses) | Inclusa | R$ 36.000 |
| **Custo total anual** | **R$ 2.100.000** | **R$ 56.400** |
| **Economia anual** | — | **R$ 2.043.600 (~97,3%)** |

**INFERÊNCIA:** Se a empresa paga plano 12 meses mas só 15% usam 1x/ano, o desperdício estrutural do modelo fixo é máximo. O Portal PJ do Bibi torna esse desperdício **visível** (não só teórico).

---

### 1.5 O que o ROI não captura (checklist CFO/RH)

| Item | Plano por vida | Bibi | Tipo |
|------|----------------|------|------|
| Internação / urgência | Geralmente incluído | Fora do escopo POC | FATO escopo |
| Reajuste anual ANS | Sim (~10–15%+) | Por evento (previsível) | INFERÊNCIA |
| Sinistralidade opaca | Alta | Dashboard consumo por CPF/equipe | INFERÊNCIA produto |
| Custo de implementação | Corretagem | Onboarding SaaS | INFERÊNCIA |
| Taxa plataforma Bibi | — | Adicionar fee mensal em proposta real | INFERÊNCIA |

**INFERÊNCIA (modelo comercial sugerido):** Fee plataforma R$ 3–8/colaborador/mês + Pay Per Use mantém economia mesmo com fee — ex.: R$ 5 × 500 = R$ 2.500 + R$ 20.400 = **R$ 22.900/mês** (~87% abaixo de R$ 175k).

---

## 2. Mapeamento de gaps de interoperabilidade

### 2.1 Integração Memed (prescrição digital)

| Etapa | Ação técnica | Conformidade | Status Bibi |
|:-----:|--------------|--------------|:-----------:|
| 1 | Cadastro como **parceiro software** na Memed (`memed.com.br/parceiro-software`) | Contrato API + DPA | ❌ |
| 2 | Obter `API_KEY` + `SECRET_KEY` (ambientes integration/production) | Credenciais em vault Netlify | ❌ |
| 3 | Backend: endpoint para provisionar **prescritor** (`external_id` = `User.id`) | LGPD: base legal tratamento | ❌ |
| 4 | Frontend atendimento: carregar **widget/iframe** Memed no `AtendimentoView` | Fluxo sem sair do PEP | ❌ |
| 5 | Webhook/callback: receita emitida → anexar PDF/link ao `MedicalRecord` + `TimelineEvent` | Rastreabilidade clínica | ❌ |
| 6 | Assinatura digital ICP via Memed (opcional) | CFM + ICP-Brasil | 🟡 |
| 7 | Homologação em sandbox + piloto com 1 prestador demo | — | ❌ |

**FATO:** Memed licencia API gratuitamente para integradores com restrições de uso comercial (`suporte-medico.memed.com.br`).

**FATO:** POC já tem PEP, templates e timeline — ponto de encaixe natural é `src/app/prestador/.../AtendimentoView` + API de procedimentos.

**LGPD (checklist):**

- [ ] DPA com Memed como operador/suboperador
- [ ] Consentimento do paciente para compartilhamento de dados da prescrição
- [ ] Registro em `TimelineEvent` + política de retenção
- [ ] Export LGPD (`patient-export.ts`) incluir prescrições vinculadas

**TISS:** Prescrição Memed **não substitui** guia TISS — são trilhas paralelas. **FATO:** Bibi já gera XML TISS simplificado (`tiss-service.ts`); integração Memed melhora **compliance clínica**, não faturamento convênio direto.

**Esforço estimado:** 3–6 semanas (1 dev full-stack) após credenciais Memed. **INFERÊNCIA.**

---

### 2.2 Integração WhatsApp Business API

| Etapa | Ação técnica | Conformidade | Status Bibi |
|:-----:|--------------|--------------|:-----------:|
| 1 | Conta **Meta Business** verificada + WABA | CNPJ, domínio | ❌ |
| 2 | Provedor BSP (Twilio, 360dialog, Z-API) ou Cloud API direta | Contrato + DPA | ❌ |
| 3 | Implementar `WhatsAppProvider` real em `src/lib/communications/adapters/` | Já previsto em `COMMUNICATIONS.md` | 🟡 interface |
| 4 | Templates Meta aprovados: `APPOINTMENT_REMINDER`, `INVOICE_DUE`, confirmação | Opt-in explícito | 🟡 templates existem |
| 5 | Opt-in beneficiário (checkbox cadastro + registro `consentAt`) | LGPD Art. 7 | 🟡 campo existe |
| 6 | Conectar `reminder-service.ts` → dispatch real (não `console`) | `COMMUNICATION_PROVIDER` | 🟡 mock |
| 7 | Webhook status entrega (lido, falha) → `Message.status` | Auditoria | 🟡 |

**FATO:** Arquitetura Strategy já separa `EmailProvider`, `SmsProvider`, `WhatsAppProvider` — troca é adapter + env vars.

**LGPD + WhatsApp:**

- Opt-in granular (marketing ≠ transacional)
- Número armazenado com finalidade documentada
- Direito de revogação no portal beneficiário (**gap** — INFERÊNCIA roadmap)

**Custo operacional (INFERÊNCIA):** R$ 0,20–0,80/conversa Meta + fee BSP; lembretes transacionais costumam ser UTILITY (menor tarifa).

**Esforço estimado:** 2–4 semanas após conta Meta aprovada. **INFERÊNCIA.**

---

### 2.3 Certificação SBIS PEP — impacto no roadmap 12 meses

| Dimensão | Sem SBIS (hoje) | Com SBIS PEP | Tipo |
|----------|-----------------|--------------|------|
| Vendas enterprise (500+ vidas) | POC/demo; RFPs hospitalares bloqueadas | Elegível a RFP técnica | INFERÊNCIA |
| Operadoras / autogestão | Parcial (B2B corporativo OK) | Credibilidade regulatória | INFERÊNCIA |
| Tempo típico certificação | — | 6–12 meses (NGS1/NGS2) | **FATO** mercado SBIS |
| Custo direto | — | R$ 80k–250k+ (consultoria + ajustes) | INFERÊNCIA |
| Pré-requisitos técnicos | SQLite POC | Postgres HA, trilha auditoria, políticas documentadas | **FATO** gap atual |

**Impacto no roadmap (INFERÊNCIA):**

| Trimestre | Sem SBIS | Com SBIS no Q4 |
|-----------|----------|----------------|
| Q1–Q2 | Vendas SMB/corporativo early adopter | Mesmo |
| Q3 | Limitação em RFPs formais | Início processo SBIS |
| Q4 | Dependência de referências | **Liberado** pipeline enterprise + operadoras regionais |

**Recomendação:** Iniciar gap analysis SBIS no **Q2** (documentação + Postgres), submissão **Q3**, certificado **Q4** — alinhado a [`03-estrategia-produto-posicionamento.md`](03-estrategia-produto-posicionamento.md).

---

## 3. Scripts de validação comercial (RH / CFO)

### 3.1 Framework “Validação Brutal” (45–60 min)

**Objetivo:** Confirmar dor real (sinistralidade opaca) e disposição a pagar por transparência + Pay Per Use.

**Roteiro rápido (síntese consultor):**

| Momento | Fala-chave |
|---------|------------|
| Gancho | “Plano reajustou ~20% e você não sabe por quê?” |
| Diferencial | “ServiceOS Pay Per Use + Price Snapshot” |
| Demo Portal PJ | Consumo por CPF, procedimento, desconto automático |
| Fechamento | “Quanto de economia nos dados para trocar custo fixo por sob demanda?” |

Detalhe completo em [`09-sintese-consultor-senior.md`](09-sintese-consultor-senior.md) §3.

---

### 3.2 Perguntas de diagnóstico (RH)

1. Como vocês recebem hoje o dado de utilização do plano? (FATO que perguntamos / INFERÊNCIA que a resposta será “boleto + relatório trimestral da operadora”)
2. Consegue listar os 10 colaboradores que mais geraram custo assistencial no último ano?
3. Qual % do quadro usou o plano nos últimos 12 meses? (Se não souber → **dor validada**)
4. Já tomaram decisão de benefício (coparticipação, rede, reajuste) sem dado granular?
5. Telemedicina/PA digital: têm? Integrado ao dado de RH?

**Sinal verde:** “Não temos visibilidade até a renovação.”  
**Sinal vermelho:** “Temos BI de sinistralidade da operadora integrado ao SAP.” (Concorrente interno)

---

### 3.3 Perguntas de diagnóstico (CFO)

1. Qual o custo por vida/mês hoje (faixa)? Comparar com R$ 350 referência.
2. Reajuste último ano (%)? Projeção próximo ciclo?
3. Preferem previsibilidade fixa ou pagar por evento com teto?
4. Como auditam desperdício (vidas que não usam)?
5. Pay Per Use com **Price Snapshot** (preço travado no atendimento) resolve qual risco que mensalidade não resolve?

**Pitch financeiro (30 segundos):**

> “Se 15% da sua base usa uma consulta por mês, vocês pagam ~R$ 11 mil em uso real versus ~R$ 175 mil em mensalidade fixa para 500 vidas. O Portal PJ mostra quem usou, quanto custou e permite ao RH agir antes do boleto da operadora.”

---

### 3.4 Objeções e respostas

| Objeção | Resposta | Tipo |
|---------|----------|------|
| “Plano cobre internação, vocês não.” | “Somos camada de atenção primária e gestão de consumo — complementamos ou substituímos o ambulatorial, não o hospitalar.” | INFERÊNCIA posicionamento |
| “RH não quer mais um portal.” | “Um portal substitui planilha + e-mail da corretora — integração API folha.” | INFERÊNCIA |
| “Médicos não vão aderir.” | “Prestador usa agenda+PEP; prescrição Memed no fluxo.” | INFERÊNCIA roadmap |
| “LGPD?” | Export paciente, timeline auditoria, consentimento, MFA admin.” | **FATO** POC parcial |

---

### 3.5 Critérios de sucesso do piloto (90 dias)

| Métrica | Meta piloto | Tipo |
|---------|-------------|------|
| Empresas ativas | 1–3 | INFERÊNCIA |
| Utilização real medida | Baseline 30 dias | FATO sistema |
| NPS RH | ≥ 8 | INFERÊNCIA |
| Tempo fechamento fatura | &lt; 5 dias pós-mês | INFERÊNCIA |
| Economia vs contrafactual | ≥ 40% vs por-vida | INFERÊNCIA |

---

## 4. Inteligência competitiva — Tier 1 (≥75% similaridade)

**Players:** Pipo Saúde, Vitta, Conexa  
**Similaridade:** B2B corporativo + dados para RH + redução sinistralidade + telemedicina.

---

### 4.1 Saúde populacional e analytics

| Capacidade | Bibi POC | Pipo Saúde | Vitta | Conexa | Fonte |
|------------|:--------:|:----------:|:-----:|:------:|-------|
| Dashboard consumo por beneficiário | ⭐✅ | 🟡 sinistro agregado | 🟡 BI sinistralidade | 🟡 populacional | FATO Bibi código / sites Tier 1 |
| Heatmap / risco populacional | ❌ | ✅ Pipo Cuida | ✅ preditiva | ✅ heatmaps | FATO Pipo/Conexa marketing |
| Score de risco / crônicos | ❌ | ✅ programas | ✅ comitê saúde | ✅ linhas cuidado | FATO sites |
| Questionários saúde / hábitos | ❌ | ✅ mapeamento | 🟡 | 🟡 | FATO Pipo |
| ROI mensurável por ação | 🟡 por consumo | ✅ reajuste −21% claim | ✅ case R$ 19,4M | ✅ −16% sinistro pc | FATO marketing Tier 1 |
| Integração folha / API RH | 🟡 OpenAPI | ⭐✅ API Pipo | 🟡 | 🟡 | FATO Pipo produtos |
| Telemedicina 24/7 | 🟡 mock | ✅ time saúde | ⭐✅ Hospital Digital | ⭐✅ PA 7 min | FATO |
| Auditoria por evento (CPF) | ⭐✅ | ❌ nível operadora | ❌ | 🟡 | INFERÊNCIA |
| Pay Per Use nativo | ⭐✅ | ❌ | ❌ | 🟡 custo/consulta | INFERÊNCIA |
| Price Snapshot | ⭐✅ | ❌ | ❌ | ❌ | **FATO** Bibi |

**FATO (Pipo):** Corretora + plataforma; sinistralidade 9–14% menor que mercado (claim marketing).  
**FATO (Vitta):** Stone; Hospital Digital 24/7; BI sinistralidade + comitês.  
**FATO (Conexa):** +35M vidas conectadas; −16% sinistro per capita (claim); Health Analytics.

**INFERÊNCIA:** Tier 1 ganha em **profundidade populacional** (crônicos, heatmaps, IA preditiva). Bibi ganha em **granularidade financeira por evento** e **modelo Pay Per Use**.

---

### 4.2 Precificação dinâmica vs tabelas fixas

| Aspecto | Bibi | Pipo / Vitta / Conexa |
|---------|------|------------------------|
| Modelo comercial | Fee + **evento** (consulta/procedimento) | **Por vida** ou pacote tele + corretagem |
| Preço no momento do uso | ⭐ Travado (`priceCharged`) | Tabela operadora / reajuste ANS anual |
| Desconto por empresa | ⭐ `PricingRule.multiplier` por procedimento | Negociação em **renovação** (21% claim Pipo) |
| Transparência prévia | ⭐ Beneficiário vê estimativa (`computePrice`) | Coparticipação fixa no plano |
| Previsibilidade CFO | Alta (utilização × preço unitário) | Média (sinistralidade + reajuste) |
| Flexibilidade por cargo/unidade | ⭐ Multi-tenant + regras por `companyId` | 🟡 coparticipação uniforme |

**FATO:** `computePrice(procedureId, companyId)` aplica multiplicador corporativo antes do snapshot.

**INFERÊNCIA — como supera tabelas fixas:**

1. **Elimina subsídio cruzado** entre não-usuários e usuários (ver ROI §1).
2. **Negociação contínua** — RH ajusta multiplier por procedimento sem esperar renovação anual.
3. **Auditoria linha a linha** — cada `ProcedureUsage` na timeline vs boleto único operadora.
4. **White label** — cada rede (ex. VitaCare) com tabela própria no mesmo ServiceOS.

**INFERÊNCIA:** Janela para o Bibi como **SaaS de infraestrutura** white-label (VitaCare, redes regionais) em vez de competir apenas head-on com Tier 1.

**FATO (dados primários vs secundários):** Bibi coleta evento no PEP (`ProcedureUsage`); Pipo/Vitta dependem majoritariamente de dados de operadoras para sinistralidade agregada.

**INFERÊNCIA — onde Tier 1 ainda vence:** previsão de **reajuste ANS** e **benchmark entre operadoras** (core corretagem Pipo/Vitta).

---

### 4.3 Matriz resumo Tier 1 × Bibi

| Dimensão | Bibi | Pipo | Vitta | Conexa |
|----------|:----:|:----:|:-----:|:------:|
| Similaridade modelo | — | 78% | 80% | 85% |
| Pay Per Use | ⭐✅ | ❌ | ❌ | 🟡 |
| Portal PJ consumo | ⭐✅ | ✅ | ✅ | ✅ |
| Populacional / IA | 🟡 | ✅ | ✅ | ⭐✅ |
| Rede prestadores própria | 🟡 | ❌ | 🟡 | ⭐✅ |
| API / webhooks | ⭐✅ | ✅ API | 🟡 | 🟡 |
| Escalabilidade multi-tenant | ⭐✅ | ❌ | ❌ | 🟡 |

---

## 5. Síntese estratégica ServiceOS

### Mensagem única (INFERÊNCIA)

> **Sistema Bibi - ServiceOS transforma saúde corporativa de custo fixo opaco em consumo auditável por evento — com preço congelado no atendimento e quatro portais na mesma operação.**

### Prioridades imediatas (alinhado roadmap)

| # | Iniciativa | Impacto comercial | Esforço |
|---|------------|-------------------|---------|
| 1 | ROI calculator no Portal PJ (500 vidas template) | Fechamento CFO | Baixo |
| 2 | WhatsApp real | Table stakes + redução faltas | Médio |
| 3 | Memed | Credibilidade clínica | Médio |
| 4 | Módulo populacional MVP (top 10% custos) | Paridade Conexa/Pipo | Alto |
| 5 | SBIS gap analysis Q2 | Enterprise Q4 | Alto |

---

## Referências

- Código: `src/lib/pricing.ts`, `ProcedureUsage.priceCharged`, `src/lib/pj-portal-service.ts`
- Docs: [`../PAYMENTS.md`](../PAYMENTS.md), [`../COMMUNICATIONS.md`](../COMMUNICATIONS.md), [`03-estrategia-produto-posicionamento.md`](03-estrategia-produto-posicionamento.md)
- Tier 1: [Pipo Saúde](https://www.piposaude.com.br/), [Vitta](https://www.vitta.com.br/), [Conexa](https://www.conexasaude.com.br/para-empregadores)

*Projeções financeiras são ilustrativas — validar com dados reais de utilização em piloto.*
