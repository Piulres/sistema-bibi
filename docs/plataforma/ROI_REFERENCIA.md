# ROI de referência — segmento saúde (Pay Per Use)

Cenário canônico para materiais comerciais, pesquisa e documentação. **Recalculado em jun/2026** com preços do seed atual.

**Fonte de preços (FATO — código):**

| Item | Valor | Onde |
|------|-------|------|
| Consulta clínica base (`CON-CLM`) | R$ 320,00 | `prisma/seed-data/pricing-market.ts` |
| Desconto corporativo TechCorp | 15% (`multiplier` 0,85) | `prisma/seed-data/companies.ts` |
| **Preço congelado (Price Snapshot)** | **R$ 272,00** | `320 × 0,85` — `computePrice()` + `PricingRule` |

**Premissas do exercício (INFERÊNCIA — benchmark mercado):**

| Variável | Valor |
|----------|-------|
| Colaboradores elegíveis | 500 |
| Plano tradicional (por vida/mês) | R$ 350,00 |
| Utilização mensal | 15% (75 consultas/mês — 1 consulta por usuário ativo) |
| Taxa plataforma SaaS | R$ 3.000,00/mês (R$ 6,00/vida — estimativa comercial) |

---

## Cenário recomendado (com taxa plataforma)

| Indicador | Plano por vida | Sistema Bibi - ServiceOS |
|-----------|----------------|--------------------------|
| Uso variável | 500 × R$ 350 = R$ 175.000 | 75 × R$ 272 = **R$ 20.400** |
| Taxa plataforma | Inclusa na mensalidade | **R$ 3.000** |
| **Total mensal** | **R$ 175.000** | **R$ 23.400** |
| **Economia mensal** | — | **R$ 151.600** |
| **Economia %** | — | **86,6%** |
| **Economia anual** | — | **~R$ 1,82 mi** |

Fórmulas:

```
custo_tradicional = vidas × ticket_vida
custo_variavel_ppu = consultas × preço_congelado
custo_ppu_total = custo_variavel_ppu + taxa_plataforma
economia_% = (custo_tradicional - custo_ppu_total) / custo_tradicional × 100
```

---

## Sensibilidade — utilização mensal (1 consulta por usuário ativo)

Preço unitário **R$ 272** + taxa plataforma **R$ 3.000**:

| Utilização | Consultas/mês | Custo PPU total | Economia vs R$ 175k | Economia % |
|:----------:|:-------------:|:---------------:|:-------------------:|:----------:|
| 5% | 25 | R$ 9.800 | R$ 165.200 | 94,4% |
| 10% | 50 | R$ 16.600 | R$ 158.400 | 90,5% |
| **15%** | **75** | **R$ 23.400** | **R$ 151.600** | **86,6%** |
| 25% | 125 | R$ 37.000 | R$ 138.000 | 78,9% |
| 40% | 200 | R$ 57.400 | R$ 117.600 | 67,2% |
| 60% | 300 | R$ 84.600 | R$ 90.400 | 51,7% |
| 100% | 500 | R$ 139.000 | R$ 36.000 | 20,6% |

**Ponto de equilíbrio (só variável, sem taxa):** `175.000 ÷ 272 ≈ 644 consultas/mês` sobre 500 vidas.

---

## Uso puro (sem taxa plataforma — sensibilidade)

| Utilização | Custo variável | Economia % |
|:----------:|:--------------:|:----------:|
| 15% | R$ 20.400 | 88,3% |
| 25% | R$ 34.000 | 80,6% |

---

## Mensagem comercial (resumo)

> Com 500 colaboradores e 15% de uso real (75 consultas/mês), o plano tradicional custa **R$ 175 mil/mês** independente do consumo. No Pay Per Use, o mesmo perfil custa **~R$ 23,4 mil/mês** (uso + plataforma) — **~87% de economia**, com cada valor auditável no Portal PJ.

**Escopo:** ambulatorial / telemedicina POC — não inclui internação nem operadora full risk.

---

## Documentos que derivam deste cenário

- [`../segmentos/medical/pesquisa-expansao-2026.md`](../segmentos/medical/pesquisa-expansao-2026.md) — detalhamento CFO/RH
- [`../pesquisa/09-sintese-consultor-senior.md`](../pesquisa/09-sintese-consultor-senior.md) — síntese executiva
- [`../../README.md`](../../README.md) — visão geral do produto

**Histórico:** versões anteriores usavam consulta a **R$ 153** (base R$ 180). O seed v2.0 fixa **R$ 320** com desconto corporativo **R$ 272**.
