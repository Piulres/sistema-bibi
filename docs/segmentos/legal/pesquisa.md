# Nicho LEGAL — LawOS (Advocacia e Consultoria Jurídica)

| Meta | Valor |
|------|-------|
| **Nicho (`niche`)** | `LEGAL` |
| **Codinome** | LawOS |
| **Versão** | 1.0 |
| **Data** | Junho/2026 |
| **Status** | Integrado no seed (Lex & Partners) |

---

## 1. Resumo executivo

Brasil ultrapassa **1,3 milhão de advogados** (OAB) — maior densidade per capita do mundo; **>60% autônomos ou bancas pequenas**. O mercado LegalTech consolida-se em gestão processual + financeiro (Astrea, ADVBox, Projuris). O ServiceOS ataca o gap **B2B corporativo**: departamentos jurídicos e escritórios que precisam faturar **hora técnica** com transparência para o cliente PJ — sem depender só de êxito ou retainer opaco.

---

## 2. TAM / SAM / SOM (2026)

| Métrica | Valor | Classificação |
|---------|-------|---------------|
| **TAM** — serviços jurídicos Brasil | Estimado **R$ 120–150 bi/ano** (honorários + corporativo) | **INFERÊNCIA** (setor fragmentado) |
| **SAM** — software jurídico (LegalTech SaaS) | **~R$ 800 mi – R$ 1,2 bi/ano** (assinaturas R$ 89–300/usuário × base ativa) | **INFERÊNCIA** |
| **SAM B2B** — assessoria jurídica corporativa externalizada | Empresas médias terceirizando compliance/contratos | **INFERÊNCIA** |
| **SOM** — LawOS Pay Per Use (12–24 meses) | 30–80 escritórios médios + 10–30 deptos. jurídicos internos | **INFERÊNCIA** |

**FATO:** 1,3 mi+ advogados inscritos; LegalTech em consolidação (EasyJur, BeansTech 2026).

---

## 3. Benchmark de preços (seed)

| Procedimento | Categoria | Preço demo | Faixa mercado 2026 | Fonte |
|--------------|-----------|------------|-------------------|-------|
| **Hora técnica jurídica** | `SERVICO` | **R$ 500** | R$ 200–1.500/h (sênior R$ 300–600) | EasyJur, LegalSuite |
| Consulta jurídica inicial | `CONSULTA` | R$ 350 | R$ 300–800 (OAB/SP ref. consulta) | Jusbrasil, buscahonorarios |
| Revisão de contrato (pacote) | `SERVICO` | R$ 2.200 | R$ 2.000–10.000 | EasyJur |
| Assessoria mensal PME (retainer) | `SESSAO` | R$ 4.000/mês | R$ 2.000–8.000/mês | EasyJur |
| Petição trabalhista (defesa empresa) | `SERVICO` | R$ 8.000 | R$ 3.000–15.000 | EasyJur |

**Seed atual:** Hora Técnica **R$ 500** — posicionamento pleno/sênior em capital.

---

## 4. Dicionário de termos (labels)

| Chave | Código atual | Recomendado | Alternativas mercado | Ação |
|-------|--------------|-------------|---------------------|------|
| `patient` | Cliente | Cliente | Contratante, assistido | **Manter** |
| `medicalRecord` | Dossiê | Dossiê | **Histórico do caso**, pasta digital | Manter (dossiê é padrão OAB) |
| `procedure` | Serviço jurídico | Serviço jurídico | Honorários, entregável | Manter |
| `appointment` | Atendimento | Atendimento | Reunião, sessão consultiva | Manter |
| `provider` | Advogado | Advogado | Consultor jurídico, advogado(a) | Manter |
| `service` | Hora técnica jurídica | Hora técnica jurídica | Timesheet, hora consultiva | Manter |

> Nota: "Prontuário" e "Paciente" são **proibidos** neste nicho — reforçar em `useLabels()` e revisão de código.

---

## 5. Concorrentes (LegalTech)

| Player | Preço entrada | Timesheet | Financeiro | Pay Per Use B2B | Gap vs Bibi |
|--------|---------------|:---------:|:----------:|:---------------:|-------------|
| **Astrea (Aurum)** | ~R$ 149/mês | 🟡 | 🟡 | ❌ | Sem portal cliente + PPU |
| **ADVBox** | ~R$ 89/mês | ✅ | ✅ | ❌ | Foco contencioso, não transacional B2B |
| **Projuris ADV** | Sob consulta | ✅ | ✅ | ❌ | Enterprise, sem sinistralidade transparente |
| **EasyJur** | Variável | ✅ | ✅ | ❌ | Sem multi-portal segregado |
| **LegalSuite** | R$ 197/mês | ✅ | ✅ | ❌ | IA contratos; sem Price Snapshot corporativo |
| **CPJ-3C** | Enterprise | ✅ | ✅ | ❌ | Grandes bancas |

**FATO:** Escritórios perdem ~22% receita por falhas em horas/faturamento (citação Legal Intelligence via BeansTech).

---

## 6. Modelos de faturamento jurídico

| Modelo | Uso | ServiceOS equivalente |
|--------|-----|----------------------|
| Hora técnica | Consultivo, tributário | `ProcedureUsage` + `priceCharged` |
| Fixo por peça | Contratos, divórcio | Procedimento catálogo preço fixo |
| Êxito (% causa) | Contencioso | Roadmap — bridge assinatura/êxito |
| Retainer mensal | Assessoria PME | `Subscription` + bridge fatura |

**Price Snapshot:** congela R$ 500/h no registro — evita disputa "a hora era R$ 400 na proposta".

---

## 7. Benefício corporativo (jurídico B2B)

Empresas médias contratam **assessoria jurídica externalizada** (compliance, trabalhista, contratos). Pay Per Use permite:

- RH/Financeiro auditar horas por área (trabalhista vs cível).
- Portal PJ vê consumo por "cliente interno" (filial, departamento).

**INFERÊNCIA:** ROI semelhante ao HealthOS quando retainer mensal fixo (R$ 8k) substituído por uso real (R$ 1,5–3k/mês em baixa demanda).

---

## 8. Implicações no produto

- Seed **Lex & Partners** com Hora Técnica R$ 500.
- PEP → renomear UI para **Dossiê** (templates futuros: petição, parecer).
- Integração futura: PJe (andamentos), não confundir com motor PPU.

---

## 9. Referências

| # | Fonte | URL |
|---|-------|-----|
| 1 | Honorários 2026 — EasyJur | https://easyjur.com/blog/como-precificar-honorarios-advocaticios/ |
| 2 | Precificação — LegalSuite | https://legalsuite.com.br/blog/como-precificar-servicos-juridicos |
| 3 | Comparativo LegalTech 2026 | https://beanstech.com.br/blog/legaltech-software-advocacia-comparativo |
| 4 | ADVBox vs Astrea vs Projuris | https://seasy.host/2026/04/02/advbox-vs-astrea-vs-projuris-adv-software-juridico-2026/ |
| 5 | Tabela OAB honorários | https://buscahonorarios.com.br/ |
