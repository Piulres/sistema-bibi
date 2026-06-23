# Nicho EDUCATION — EduOS (Instrutores, Mentorias e Cursos)

| Meta | Valor |
|------|-------|
| **Nicho (`niche`)** | `EDUCATION` |
| **Codinome** | EduOS |
| **Versão** | 1.0 |
| **Data** | Junho/2026 |
| **Status** | Integrado no seed (EduPrime) |

---

## 1. Resumo executivo

O mercado brasileiro de **educação online e infoprodutos** está maduro: Hotmart (+35 mi usuários), ticket médio infoproduto ~**R$ 155** (CNDL/SPC), com faixa **R$ 27–997+**. Mentorias e aulas particulares operam em modelo **hora/aula** ou **high ticket** — ideal para Pay Per Use quando empresas subsidiam **upskilling** de colaboradores (crédito educacional) em vez de assinatura de plataforma ociosa.

---

## 2. TAM / SAM / SOM (2026)

| Métrica | Valor | Classificação |
|---------|-------|---------------|
| **TAM** — EdTech + infoprodutos Brasil | **~R$ 35–50 bi/ano** (cursos, mentorias, preparatórios) | **INFERÊNCIA** |
| **SAM** — aulas particulares + mentorias online | Milhões de alunos; Superprof, italki, Hotmart Mentoria | **FATO** (fragmentado) |
| **SAM B2B** — educação corporativa (L&D) | Mercado corporativo treinamento **~R$ 8–12 bi** | **INFERÊNCIA** |
| **SOM** — EduOS Pay Per Use | 20–60 escolas/mentores B2B + empresas crédito aula | **INFERÊNCIA** |

**FATO:** Hotmart cobra 9,9% + R$ 1/venda; mentorias high ticket R$ 997–10.000+.

---

## 3. Benchmark de preços (seed)

| Procedimento | Categoria | Preço demo | Faixa mercado 2026 | Fonte |
|--------------|-----------|------------|-------------------|-------|
| **Aula particular** (geral) | `SESSAO` | **R$ 150** | R$ 40–300/h conforme matéria | Ganhe Recompensa |
| Aula programação (intermediário) | `SESSAO` | R$ 150 | R$ 80–300/h | Ganhe Recompensa |
| Aula inglês (intermediário) | `SESSAO` | R$ 90 | R$ 50–200/h | Ganhe Recompensa |
| Mentoria individual (sessão) | `SESSAO` | R$ 497 | R$ 497–2.000/sessão | Hotmart, Lucro Milionário |
| Workshop ao vivo (grupo) | `SESSAO` | R$ 197 | R$ 97–497 | Hotmart |
| Curso completo (referência) | `SERVICO` | R$ 497 | R$ 197–1.997 | Hotmart |

**Seed atual:** Aula Particular **R$ 150** — alinhado ao intermediário (R$ 80–150/h).

---

## 4. Dicionário de termos (labels)

| Chave | Código atual | Recomendado | Alternativas | Ação |
|-------|--------------|-------------|--------------|------|
| `patient` | Aluno | Aluno | Aprendiz, mentorado | Manter |
| `beneficiary` | Aluno | Aluno | Colaborador (B2B) | Manter |
| `provider` | Instrutor | Instrutor | Mentor, professor | Manter |
| `procedure` | Aula | Aula | Sessão, módulo | Manter |
| `appointment` | Aula | Aula | Horário de aula, slot | Manter |
| `medicalRecord` | Histórico pedagógico | Histórico pedagógico | Portfólio, trilha | Manter |
| `company` | Instituição | Instituição | Empresa (L&D) | Manter |

---

## 5. Concorrentes

| Player | Modelo | Pay Per Use / crédito | B2B | Gap vs Bibi |
|--------|--------|:---------------------:|:---:|-------------|
| **Hotmart** | Marketplace infoproduto | 🟡 por venda | 🟡 | Sem 4 portais + Price Snapshot |
| **Superprof / Profes** | Marketplace aula | ✅ por hora | ❌ | Sem faturamento corporativo |
| **italki / Preply** | Idiomas online | ✅ por hora | ❌ | Nicho único |
| **Udemy Business** | Assinatura corp. | ❌ | ✅ | Caixa preta (licenças) |
| **Coursera for Business** | Assinatura | ❌ | ✅ | Sem prestador local |
| **Pluralsight / Alura** | Assinatura B2B | ❌ | ✅ | Sem mentoria 1:1 PPU |

---

## 6. Pay Per Use vs assinatura de plataforma

| Assinatura Udemy/Alura (corp.) | ServiceOS Edu |
|--------------------------------|---------------|
| R$ 30–80/colaborador/mês | Crédito só em aulas realizadas |
| Uso muitas vezes < 10% | Portal PJ audita consumo |
| Catálogo genérico | Mentores/instrutores credenciados |

**INFERÊNCIA:** Empresa com 200 colaboradores × R$ 50/mês = R$ 10k/mês fixo. Pay Per Use: 30 aulas/mês × R$ 150 = R$ 4,5k — economia **~55%** em baixa adesão.

---

## 7. Benefício corporativo (L&D)

- **Vale-educação** e crédito curso são tendência pós-pandemia.
- Pitch: "Cada hora de mentoria registrada, precificada e auditável."
- Portal beneficiário: aluno agenda slot com instrutor credenciado.

---

## 8. Implicações no produto

- Tenant **EduPrime** — expandir catálogo (inglês, programação).
- Slots de 30–60 min no `scheduling-service` (já existe padrão saúde).
- PEP → "Histórico pedagógico" (evolução, notas de aula).

---

## 9. Referências

| # | Fonte | URL |
|---|-------|-----|
| 1 | Aulas particulares online 2026 | https://ganherecompensa.com.br/blog/como-dar-aulas-particulares-online-2026-plataformas-valores |
| 2 | Precificação curso — Hotmart | https://hotmart.com/pt-br/blog/como-precificar-curso-online |
| 3 | Infoprodutos 2026 | https://lucromilionario.com/infoprodutos-como-criar-vender/ |
| 4 | Mentoria Hotmart | https://hotmart.com/pt-br/mentoria |
