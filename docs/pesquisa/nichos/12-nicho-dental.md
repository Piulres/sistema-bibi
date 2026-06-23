# Nicho DENTAL — Odontologia (Consultórios e Clínicas)

| Meta | Valor |
|------|-------|
| **Nicho (`niche`)** | `DENTAL` |
| **Codinome** | SmileOS / DentalOS |
| **Versão** | 1.0 |
| **Data** | Junho/2026 |
| **Status** | Integrado no seed (Smile Odonto) |

---

## 1. Resumo executivo

O mercado odontológico brasileiro combina **alto volume de procedimentos preventivos** (limpeza, consulta) com **ticket alto** (implante, ortodontia). Planos exclusivamente odontológicos cobram mensalidade baixa (R$ 20–120) mas com rede restrita e coparticipação. O ServiceOS oferece **Pay Per Use transparente** para empresas que preferem subsidiar uso real em vez de plano fechado — especialmente PMEs com baixa utilização.

**FATO (ANS/Milliman):** custo assistencial médio ~**R$ 13,43/beneficiário/mês** em planos odontológicos (grupo estudado 2025).

---

## 2. TAM / SAM / SOM (2026)

| Métrica | Valor | Classificação |
|---------|-------|---------------|
| **TAM** — planos odontológicos + particular | **~R$ 25–35 bi/ano** (beneficiários ANS + particular) | **INFERÊNCIA** |
| **SAM** — software clínica odonto (ERP) | iClinic, Feegow, Dental Office, Clinicorp | **INFERÊNCIA** |
| **SAM B2B** — odonto corporativo (PME) | Coparticipação + voucher odonto | **INFERÊNCIA** |
| **SOM** — DentalOS Pay Per Use | 40–100 clínicas credenciadas corporativas | **INFERÊNCIA** |

---

## 3. Benchmark de preços (seed)

| Procedimento | Categoria | Preço demo | Faixa mercado 2026 | Fonte |
|--------------|-----------|------------|-------------------|-------|
| **Consulta odontológica** | `CONSULTA` | **R$ 350** | R$ 50–400 (média R$ 150) | Achei Profissional, DentMap |
| Limpeza / profilaxia | `SERVICO` | **R$ 200** | R$ 80–450 (SP média R$ 200) | DentMap, Achei Profissional |
| Tratamento de canal (1 canal) | `SERVICO` | **R$ 800** | R$ 400–1.800 | Achei Profissional |
| Canal molar (3+ canais) | `SERVICO` | R$ 1.400 | R$ 700–3.000 | Achei Profissional |
| Restauração resina | `SERVICO` | R$ 250 | R$ 100–600 | Achei Profissional |
| Clareamento dental | `SERVICO` | R$ 1.200 | R$ 500–2.000 | DentMap |
| Implante (unidade) | `SERVICO` | R$ 3.200 | R$ 1.500–5.000 (SP) | DentMap |

**Seed atual:** Consulta Odontológica **R$ 350** — posicionamento premium capital (acima da média nacional R$ 150, adequado para demo corporativo).

**Recomendação seed:** adicionar **Limpeza dental R$ 200** e **Canal R$ 800** como procedimentos secundários.

---

## 4. Dicionário de termos (labels)

| Chave | Código atual | Recomendado | Alternativas | Ação |
|-------|--------------|-------------|--------------|------|
| `patient` | Paciente | Paciente | Paciente odontológico | Manter |
| `appointment` | Consulta odontológica | Consulta odontológica | Avaliação, retorno | Manter |
| `procedure` | Proced. odontológico | Procedimento odontológico | Tratamento | Manter |
| `medicalRecord` | Prontuário | **Odontograma / Prontuário odontológico** | Ficha odonto | Considerar override |
| `provider` | Prestador | **Dentista** | Cirurgião-dentista | Opcional |

---

## 5. Concorrentes

| Player | Modelo | Plano corp. | Pay Per Use | Gap vs Bibi |
|--------|--------|:-----------:|:-----------:|-------------|
| **Odontoprev / MetLife Odonto** | Operadora plano | ✅ | ❌ | Caixa preta sinistralidade |
| **Dental Uni / Interodonto** | Cooperativa plano | ✅ | ❌ | Sem portal prestador unificado |
| **iClinic / Feegow** | ERP clínica | ❌ | ❌ | Sem B2B PPU |
| **Clinicorp / Dental Office** | SaaS odonto | 🟡 | ❌ | Foco agenda/financeiro clínica |
| **DentMap** | Marketplace agendamento | ❌ | 🟡 | Sem faturamento corporativo |

---

## 6. Pay Per Use vs plano odontológico

| Plano odontológico (ANS) | ServiceOS Dental |
|--------------------------|------------------|
| R$ 20–120/mês por vida | Paga só limpeza/consulta usada |
| Rede credenciada fixa | Qualquer dentista credenciado na rede Bibi |
| Coparticipação 30–60% em tratamentos | Preço congelado no ato (`priceCharged`) |
| Custo assistencial ~R$ 13,43/vida/mês (média) | Transparente por procedimento |

**INFERÊNCIA:** Para empresas com **< 2 procedimentos/ano/colaborador**, Pay Per Use economiza **50–70%** vs plano mensal pleno.

**Cenário demo:** 500 colaboradores × R$ 40/mês plano = R$ 20k/mês vs 75 limpezas/ano × R$ 200 = R$ 15k/ano (~R$ 1,25k/mês) + taxa plataforma.

---

## 7. Benefício corporativo

- Odonto corporativo é **table stakes** em benefícios PME.
- Pitch: "Odonto sem desperdício — o RH vê cada limpeza e canal faturado."
- Integração: carteirinha digital futura; hoje portal beneficiário self-service.

---

## 8. Implicações no produto

- Expandir seed Smile com limpeza + canal.
- TISS odonto (TUSS) — campo `tissCode` opcional em `Procedure`.
- Landing DENTAL: "odonto corporativo pay per use".

---

## 9. Referências

| # | Fonte | URL |
|---|-------|-----|
| 1 | Tabela preços dentista 2026 | https://acheioprofissional.com.br/blog/tabela-precos-dentista-2026 |
| 2 | Limpeza dental por cidade | https://dentmap.com.br/blog/quanto-custa-limpeza-dental |
| 3 | Milliman — planos odontológicos ANS | https://br.milliman.com/pt-BR/insight/mercado-de-planos-exclusivamente-odontologicos |
| 4 | DentMap procedimentos | https://dentmap.com.br/procedimentos |
