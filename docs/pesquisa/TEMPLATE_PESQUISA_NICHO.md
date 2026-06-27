# Template — Pesquisa de Nicho (Sistema Bibi - ServiceOS)

> **Como usar:** copie o template para `docs/segmentos/{segmento}/pesquisa.md`, preencha todas as seções e marque **FATO** vs **INFERÊNCIA**. Atualize `docs/segmentos/README.md` e, se aplicável, `src/constants/niches.ts` + `prisma/seed-data/niche-tenants.ts`.

| Meta | Valor |
|------|-------|
| **Nicho (`niche`)** | `MEDICAL` \| `VET` \| `DENTAL` \| `LEGAL` \| `SPA` \| `EDUCATION` |
| **Codinome comercial** | ex.: PetOS, LawOS, EduOS |
| **Versão** | 1.0 |
| **Data** | AAAA/MM |
| **Pesquisador** | Nome / IA + fontes |
| **Status** | Rascunho \| Revisado \| Integrado no seed |

---

## 1. Resumo executivo

(3–5 frases: oportunidade, diferencial ServiceOS, principal concorrente, preço âncora.)

---

## 2. TAM / SAM / SOM (2026)

| Métrica | Valor | Horizonte | Classificação |
|---------|-------|-----------|---------------|
| **TAM** (mercado total endereçável) | R$ … / US$ … | Anual | FATO / INFERÊNCIA |
| **SAM** (mercado atendível — B2B + Pay Per Use) | R$ … | Anual | FATO / INFERÊNCIA |
| **SOM** (meta realista 12–24 meses) | R$ … ou N clientes | 12–24 meses | INFERÊNCIA |

### Fontes e premissas

- Liste URLs, relatórios e premissas de cálculo.
- Ex.: população de prestadores × ticket médio × taxa de adoção SaaS.

---

## 3. Benchmark de preços (seed)

Valores para `prisma/seed-data/niche-tenants.ts` e catálogo `Procedure`.

| Procedimento / serviço | Categoria | Preço demo (R$) | Faixa mercado 2026 | Fonte |
|------------------------|-----------|-----------------|-------------------|-------|
| … | `CONSULTA` \| `SERVICO` \| `SESSAO` | … | … | … |

**Regra seed:** preço demo = **mediana da faixa** em capitais; documentar overrides por `PricingRule`.

---

## 4. Dicionário de termos (labels)

Mapeamento ServiceOS genérico → vocabulário do segmento.

| Chave (`NicheLabelKey`) | Termo atual no código | Termo recomendado | Alternativas mercado | Ação |
|-------------------------|----------------------|-------------------|---------------------|------|
| `patient` | … | … | … | Manter / Alterar |
| `medicalRecord` | … | … | … | … |
| … | … | … | … | … |

**Arquivos a atualizar se mudar:** `src/constants/niches.ts`, `Tenant.labels` no seed, `AGENTS.md` glossário.

---

## 5. Concorrentes e posicionamento

| Player | Modelo | Pay Per Use / uso | Portal cliente | White label | Gap vs Bibi |
|--------|--------|-------------------|----------------|-------------|-------------|
| … | SaaS / franquia / marketplace | ✅ / 🟡 / ❌ | … | … | … |

### Oportunidade ServiceOS

- O que o mercado cobra por **elegibilidade** vs o que o Bibi cobra por **uso**.
- Price Snapshot como diferencial.

---

## 6. Pay Per Use vs modelo tradicional

| Modelo tradicional | Modelo ServiceOS | Economia / transparência |
|--------------------|------------------|--------------------------|
| … | … | … |

---

## 7. Benefício corporativo (B2B)

- Como empresas compram hoje (plano, voucher, auxílio, coparticipação).
- Pitch para RH/CFO do nicho.
- Integração com portal PJ do Bibi.

---

## 8. Implicações no produto

| Área | Recomendação |
|------|--------------|
| Seed | Procedimentos e tenants demo |
| Labels | Overrides em `Tenant.labels` |
| Landing | Keywords em `landing-content.ts` |
| Compliance | Regulatório específico (se houver) |
| Comercial | Criar/atualizar `docs/segmentos/{segmento}/COMERCIAL.md` (ver [`../comercial/ESTRATEGIA_SEGMENTOS.md`](../comercial/ESTRATEGIA_SEGMENTOS.md)) |

---

## 9. Prompt de pesquisa (replicação)

```text
Atue como analista de mercado. Pesquise o nicho [NOME] no Brasil em 2026.
Entregue: TAM/SAM/SOM, tabela de preços (consulta, serviço principal, high ticket),
glossário de termos (paciente→?), top 5 concorrentes, tendência B2B corporativo.
Separe FATO (dado publicado) de INFERÊNCIA (projeção).
Formato: markdown seguindo docs/pesquisa/TEMPLATE_PESQUISA_NICHO.md
```

---

## 10. Referências

| # | Fonte | URL | Data acesso |
|---|-------|-----|-------------|
| 1 | … | … | … |

---

*Documento de pesquisa — não substitui due diligence comercial.*
