# Nicho VET — PetOS (Veterinária e Pet Care)

| Meta | Valor |
|------|-------|
| **Nicho (`niche`)** | `VET` |
| **Codinome** | PetOS |
| **Versão** | 1.0 |
| **Data** | Junho/2026 |
| **Status** | Integrado no seed (PetCare) |

---

## 1. Resumo executivo

O Brasil é o **3º maior mercado pet do mundo** (projeção 2026), com forte demanda por serviços (banho/tosa, clínica) além de ração. O **auxílio pet corporativo** emerge como benefício de RH (vale-pet, planos com reembolso). O ServiceOS posiciona-se como infraestrutura **Pay Per Use** para redes de pet shops e clínicas que atendem empresas — transparência de consumo vs plano fechado por tutor.

**Diferencial Bibi:** mesmo motor de faturamento da saúde, com labels "Pet/Tutor" e Price Snapshot em cada banho ou consulta.

---

## 2. TAM / SAM / SOM (2026)

| Métrica | Valor | Classificação |
|---------|-------|---------------|
| **TAM** — mercado pet Brasil | **R$ 77,96 bi** (2025); projeção **> R$ 80 bi** (2026) | **FATO** (Abempet / Folha mar/2026) |
| **SAM** — serviços veterinários + estética (banho/tosa) | **~R$ 15,1 bi** (R$ 8,18 bi vet + R$ 6,94 bi serviços gerais, 2025) | **FATO** (Abempet) |
| **SAM B2B** — benefício corporativo pet | Mercado em consolidação; Guapeco +220 empresas; 228 vagas com "auxílio pet" no Infojobs T1/2026 | **FATO** (parcial) + **INFERÊNCIA** |
| **SOM** — SaaS Pay Per Use pet B2B (12–24 meses) | 50–150 tenants PJ + 5–20 redes credenciadas; ARR estimado R$ 1,2–4,8 mi | **INFERÊNCIA** |

### Premissas SOM

- Take rate 3–5% sobre GMV transacionado (consultas + estética corporativa).
- Ticket médio corporativo: R$ 80–150/uso × 2 usos/ano/tutor elegível.

---

## 3. Benchmark de preços (seed)

| Procedimento | Categoria | Preço demo | Faixa mercado 2026 | Fonte |
|--------------|-----------|------------|-------------------|-------|
| Consulta veterinária geral | `CONSULTA` | **R$ 180** | R$ 100–300 (SP/RJ até R$ 350) | AcharVet, Abempet |
| Banho e tosa (porte médio) | `SERVICO` | **R$ 150** | Combo banho+tosa médio: R$ 110–180 | Hashiko 2026 |
| Banho simples (pequeno) | `SERVICO` | R$ 60 | R$ 45–75 | Hashiko |
| Vacinação (V8/V10) | `SERVICO` | R$ 120 | R$ 80–180 | AcharVet |
| Consulta especialista | `CONSULTA` | R$ 320 | R$ 200–450 | AcharVet |

**Seed atual:** catálogo completo (consulta, vacinação, exames, cirurgia, internação, estética). Agenda interna usa label padrão **Atendimentos** (sem override banho/tosa).

---

## 4. Dicionário de termos (labels)

| Chave | Código atual | Recomendado | Alternativas | Ação |
|-------|--------------|-------------|--------------|------|
| `patient` | Pet | Pet | Animal, paciente veterinário | **Manter** |
| `beneficiary` | Tutor | Tutor | Responsável, dono | **Manter** |
| `medicalRecord` | Ficha clínica | Ficha clínica | Prontuário vet, histórico clínico | Manter |
| `appointment` | Atendimento | **Banho/Tosa** (override demo) | Agendamento, sessão estética | Override tenant |
| `provider` | Veterinário | Veterinário | Groomer, profissional pet | Manter |
| `company` | Parceiro | Parceiro corporativo | Empresa contratante | Opcional |

---

## 5. Concorrentes

| Player | Modelo | Pay Per Use | B2B corporativo | Gap vs Bibi |
|--------|--------|:-----------:|:---------------:|-------------|
| **Petz / Cobasi** | Varejo + serviços | ❌ | 🟡 parcerias | Sem portal PJ transacional |
| **DogHero / Petlove** | Marketplace + plano pet | ❌ | 🟡 plano saúde pet | Foco B2C assinatura |
| **Guapeco** | Benefício corp. reembolso | 🟡 por uso reembolsado | ✅ | Sem motor prestador + Price Snapshot |
| **People Pet** | Plano pet empresas | ❌ | ✅ | Caixa preta sinistralidade |
| **Vetus / SimplesVet** | ERP clínica vet | ❌ | 🟡 | Sem Pay Per Use B2B multi-portal |
| **Hashiko / ERPs pet shop** | Gestão + agenda | ❌ | ❌ | Sem portal tutor self-service |

---

## 6. Pay Per Use vs plano pet

| Tradicional | ServiceOS |
|-------------|-----------|
| Mensalidade plano pet (R$ 80–200/mês) por animal | Cobra só consulta/banho utilizado |
| Rede credenciada fechada | Prestador registra uso + preço congelado |
| Sinistralidade opaca para RH | Portal PJ audita cada procedimento |

**INFERÊNCIA:** Empresas com vale-pet de R$ 50–150/mês podem migrar para crédito Pay Per Use com **~40–60% economia** se uso real < 4 atendimentos/ano (cenário similar ao ROI saúde).

---

## 7. Benefício corporativo (auxílio pet)

**FATO:** Tendências 2025–2026 — vale-pet mensal, plano com reembolso (Guapeco), licença pet em vagas (Infojobs).

**Pitch RH:** "Seu colaborador escolhe o veterinário; você paga só o que foi usado, com nota fiscal e preço travado no atendimento."

---

## 8. Implicações no produto

- Manter tenant **PetCare** com override `Banho/Tosa`.
- Landing: keywords `auxílio pet`, `pet corporativo`, `banho e tosa`.
- Futuro: integração com operadoras pet (API reembolso).

---

## 9. Referências

| # | Fonte | URL |
|---|-------|-----|
| 1 | Abempet / Folha — mercado R$ 77,96 bi 2025 | https://www1.folha.uol.com.br/mercado/2026/03/mercado-pet-retrai-pela-primeira-vez-em-seis-anos.shtml |
| 2 | Tabela preços vet 2026 | https://acharvet.com.br/guias/quanto-custa-veterinario |
| 3 | Banho e tosa 2026 | https://www.hashiko.com.br/blog/quanto-cobrar-banho-e-tosa-2026 |
| 4 | Benefício corporativo pet | https://www.guapeco.com.br/beneficio-corporativo-pet/ |
| 5 | Plano saúde pet corporativo | https://revistaapolice.com.br/2026/04/plano-de-saude-pet-avanca-e-vira-beneficio-corporativo/ |
