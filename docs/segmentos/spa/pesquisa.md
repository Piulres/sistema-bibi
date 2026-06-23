# Nicho SPA — Bem-estar, Spa e Estética Corporativa

| Meta | Valor |
|------|-------|
| **Nicho (`niche`)** | `SPA` |
| **Codinome** | WellnessOS / SpaOS |
| **Versão** | 1.0 |
| **Data** | Junho/2026 |
| **Status** | Integrado no seed (Zen Studio) |

---

## 1. Resumo executivo

O **bem-estar corporativo** no Brasil atingiu **US$ 1,6 bilhão em 2025**, com projeção de **US$ 2,7 bi até 2034** (CAGR 5,7%). Redes como **Buddha Spa** (R$ 150 mi faturamento 2024) escalam **quick massage in loco** e vouchers corporativos. O ServiceOS permite que empresas paguem **sessões utilizadas** (massagem, yoga, drenagem) com transparência — alternativa a pacotes anuais de wellness pouco consumidos.

**FATO (GWI):** mercado global wellness ~US$ 6,3 tri; Brasil 12º em consumo.

---

## 2. TAM / SAM / SOM (2026)

| Métrica | Valor | Classificação |
|---------|-------|---------------|
| **TAM** — wellness Brasil (spa + corp.) | **US$ 1,6 bi (~R$ 9,6 bi)** 2025 | **FATO** (IMARC Group) |
| **SAM** — bem-estar corporativo programático | Quick massage, vouchers, EAP + spa | **INFERÊNCIA** |
| **SAM** — clínicas estética + spa particular | Buddha, Vittae, redes regionais | **FATO** (fragmentado) |
| **SOM** — SpaOS Pay Per Use B2B | 15–50 redes parceiras + 30–80 empresas | **INFERÊNCIA** |

---

## 3. Benchmark de preços (seed)

| Procedimento | Categoria | Preço demo | Faixa mercado 2026 | Fonte |
|--------------|-----------|------------|-------------------|-------|
| **Aula de yoga** (grupo) | `SESSAO` | **R$ 120** | R$ 80–200/sessão | Mercado studios |
| Quick massage (20 min) | `SESSAO` | **R$ 90** | R$ 74–121 | Vittae Spa |
| Massagem relaxante (1h) | `SESSAO` | **R$ 180** | R$ 180–280 (mercado) | Vittae, Cercano — **INFERÊNCIA** |
| Massagem terapêutica (1h) | `SESSAO` | R$ 220 | R$ 121–250 | Vittae |
| Drenagem linfática (1h) | `SESSAO` | R$ 189 | R$ 189–280 | Vittae |
| Day spa (pacote) | `SERVICO` | R$ 450 | R$ 350–950 | Hotéis/spas premium |
| Harmonização / estética avançada | `SERVICO` | R$ 2.000+ | R$ 1.500–5.000/sessão | Clínicas estética |

**Seed atual:** Aula de Yoga **R$ 120** — alinhado à faixa studios urbanos.

**FATO (seed Zen Studio):** `SPA-MSG` = R$ 180 em `prisma/seed-data/niche-tenants.ts`. Faixas de mercado acima são **INFERÊNCIA**.

---

## 4. Dicionário de termos (labels)

| Chave | Código atual | Recomendado | Alternativas | Ação |
|-------|--------------|-------------|--------------|------|
| `patient` | Cliente | Cliente | Hóspede, visitante | Manter |
| `procedure` | Sessão | Sessão | Terapia, ritual, tratamento | Manter |
| `appointment` | Agendamento | Agendamento | Reserva, horário | Manter |
| `medicalRecord` | Ficha de atendimento | Ficha de atendimento | Anamnese, histórico wellness | Manter |
| `provider` | Profissional | Profissional | Terapeuta, massagista | Manter |
| `service` | Serviço de bem-estar | Serviço de bem-estar | Experiência wellness | Manter |

---

## 5. Concorrentes

| Player | Modelo | Corporativo | Pay Per Use | Gap vs Bibi |
|--------|--------|:-----------:|:-----------:|-------------|
| **Buddha Spa** | Franquia + corp. | ✅ vouchers, in loco | 🟡 voucher | Sem portal PJ transacional |
| **Vittae Spa** | Spa urbano | 🟡 | ✅ por sessão | Sem B2B multi-tenant |
| **Wellhub (Gympass)** | Assinatura wellness | ✅ | ❌ | Caixa preta (acesso) |
| **TotalPass** | Assinatura academias | ✅ | ❌ | Foco fitness, não spa |
| **Zenklub / Vittude** | EAP saúde mental | ✅ assinatura | ❌ | Vertical diferente |
| **ClassPass** | Créditos aulas | 🟡 créditos | 🟡 | Sem Price Snapshot |

---

## 6. Pay Per Use vs pacote wellness corporativo

| Pacote anual wellness (Gympass/Wellhub) | ServiceOS Spa |
|----------------------------------------|---------------|
| R$ 50–150/colaborador/mês | Só sessões agendadas |
| Uso frequentemente < 20% | RH vê cada massagem/yoga |
| Rede fechada de parceiros | Credenciamento dinâmico |

**INFERÊNCIA:** Empresa 300 colaboradores × R$ 80/mês Wellhub = R$ 24k/mês. Pay Per Use: 60 sessões/mês × R$ 120 = R$ 7,2k (~**70% economia**) em baixa adesão.

---

## 7. Benefício corporativo

**FATO:** Buddha Spa Corporativo — quick massage in loco, vouchers 90 dias, parcerias RH.

**Pitch:** "Bem-estar sem assinatura ociosa — massage therapist na empresa ou crédito em rede credenciada, faturado por sessão."

**Tendências:** quick massage, yoga no escritório, mindfulness, NR-1 saúde mental.

---

## 8. Implicações no produto

- Tenant **Zen Studio** — adicionar quick massage ao seed.
- Agendamento slots 20/30/60 min.
- Landing SPA: `bem-estar corporativo`, `quick massage`.

---

## 9. Referências

| # | Fonte | URL |
|---|-------|-----|
| 1 | Mercado bem-estar corporativo BR | https://www.imarcgroup.com/report/pt-br/brazil-corporate-wellness-market |
| 2 | Buddha Spa corporativo | https://buddhaspa.com.br/corporativo/ |
| 3 | Buddha Spa expansão 2025 | https://timesbrasil.com.br/empresas-e-negocios/com-foco-no-mercado-de-bem-estar-buddha-spa-planeja-internacionalizacao-na-america-latina/ |
| 4 | Preços massagem — Vittae | https://vittaespa.com.br/spa/massagens/ |
| 5 | Menu spa — referência premium | https://cercano.com.br/menu-spa/ |
