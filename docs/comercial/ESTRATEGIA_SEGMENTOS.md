# Estratégia comercial por segmento

Matriz de **técnicas de captação, vendas e marketing** para cada vertical do ServiceOS. O produto é horizontal; a **abordagem comercial não é**.

> **Features compartilhadas:** [`MODULOS_COMUNS.md`](MODULOS_COMUNS.md)  
> **Pesquisa de mercado:** [`../pesquisa/README.md`](../pesquisa/README.md)

---

## Princípio: um motor, seis narrativas

```text
                    ┌─────────────────────────┐
                    │  Motor Pay Per Use      │
                    │  4 portais · white label│
                    └───────────┬─────────────┘
          ┌─────────┬───────────┼───────────┬─────────┬─────────┐
          ▼         ▼           ▼           ▼         ▼         ▼
      MEDICAL     VET        DENTAL      LEGAL      SPA    EDUCATION
     sinistral.  auxílio    odonto      hora       wellness  L&D
     saúde corp. pet corp.  corp.       técnica    corp.     crédito
```

---

## Matriz rápida — ICP, dor e técnica

| Nicho | Codinome | ICP primário | Dor #1 | Técnica de captação | Decisor | Doc |
|-------|----------|--------------|--------|---------------------|---------|-----|
| `MEDICAL` | vertical saúde | RH/CFO PME 100–1k vidas | Sinistralidade opaca do plano fechado | ROI 87% + demo Portal PJ | CFO | [`medical/COMERCIAL.md`](../segmentos/medical/COMERCIAL.md) |
| `VET` | PetOS | Redes pet + RH com auxílio pet | Plano pet por tutor ocioso | Benefício em alta (Infojobs) + ticket por pet | RH / dono rede | [`vet/COMERCIAL.md`](../segmentos/vet/COMERCIAL.md) |
| `DENTAL` | DentalOS | Clínicas credenciadas + RH | Plano odonto mensal com baixo uso | Table stakes benefício + economia por procedimento | RH / gestor clínica | [`dental/COMERCIAL.md`](../segmentos/dental/COMERCIAL.md) |
| `LEGAL` | LawOS | Escritórios médios + dept. jurídico | Horas não faturadas / retainer opaco | Timesheet + Price Snapshot por hora | Sócio / GC | [`legal/COMERCIAL.md`](../segmentos/legal/COMERCIAL.md) |
| `SPA` | SpaOS | Redes spa + RH wellness | Gympass/Wellhub com <20% uso | NR-1 + quick massage in company | RH / People | [`spa/COMERCIAL.md`](../segmentos/spa/COMERCIAL.md) |
| `EDUCATION` | EduOS | Escolas + L&D corporativo | Udemy/Alura ociosa | Crédito por aula realizada | L&D / RH | [`education/COMERCIAL.md`](../segmentos/education/COMERCIAL.md) |

---

## Técnicas por tipo de argumento

### A. Argumento financeiro (CFO / Financeiro)

**Segmentos:** `MEDICAL`, `DENTAL`, `VET`, `SPA`, `EDUCATION`

| Técnica | Como aplicar |
|---------|--------------|
| Comparativo plano fechado vs. Pay Per Use | Tabela ROI com vidas × ticket × % utilização |
| Price Snapshot como auditoria | Demo Portal PJ — cada linha com valor congelado |
| Break-even de utilização | "A partir de X% de uso, plano fechado é mais barato" |
| Piloto 90 dias | Contrato limitado com relatório de consumo real |

**Referência canônica ROI:** [`../plataforma/ROI_REFERENCIA.md`](../plataforma/ROI_REFERENCIA.md) (cenário saúde 500 vidas).

### B. Argumento operacional (gestor da operação)

**Segmentos:** todos

| Técnica | Como aplicar |
|---------|--------------|
| Demo dos 4 portais | Fluxo atendimento → registro → fatura em uma sessão |
| White label | Mostrar tenant demo com marca do segmento |
| Mapa CRUD | `/interno/cadastros?tab=operations` — profundidade da POC |
| Importação | Reduzir medo de migração (JSON/CSV) |

### C. Argumento de produtividade (prestador)

**Segmentos:** `LEGAL` (hora técnica), `EDUCATION` (instrutor), `MEDICAL`/`DENTAL`/`VET` (clínico)

| Técnica | Como aplicar |
|---------|--------------|
| Agenda + registro em poucos cliques | Portal prestador ao vivo |
| Templates de registro | PEP / dossiê / histórico pedagógico |
| Extrato transparente | Prestador vê o que foi faturado |

### D. Argumento de benefício (RH / People)

**Segmentos:** `VET`, `SPA`, `EDUCATION`, `DENTAL`

| Técnica | Como aplicar |
|---------|--------------|
| Tendência de benefício flexível | Dados de mercado (auxílio pet, wellness, L&D) |
| Self-service do colaborador | Portal beneficiário — agendar sem call center |
| Relatório exportável | CSV para prestação de contas interna |

### E. Argumento enterprise (RFP / GC)

**Segmentos:** `MEDICAL`, `LEGAL`

| Técnica | Como aplicar |
|---------|--------------|
| API + webhooks | `/openapi.yaml`, integrações |
| MFA + RBAC + auditoria | `/interno/seguranca` |
| LGPD | Fluxos de exportação/exclusão |
| Roadmap SBIS / TISS | Honestidade sobre gaps — ver BENCHMARK |

---

## Features: comum vs. individual (resumo)

### Comuns a todos os módulos

Ver lista completa em [`MODULOS_COMUNS.md`](MODULOS_COMUNS.md). Resumo em 5 blocos:

1. Pay Per Use + Price Snapshot + precificação B2B  
2. Quatro portais integrados (interno, prestador, PJ, beneficiário)  
3. White label + multi-tenant + labels por nicho  
4. Faturamento (faturas, assinaturas, PIX mock, CRM)  
5. Enterprise base (API, webhooks, RBAC, MFA, LGPD, auditoria)

### Individuais por segmento

| Nicho | Features / módulos específicos (implementados) |
|-------|--------------------------------------------------|
| `MEDICAL` | TISS XML, telemedicina (mock), PEP médico (receita, atestado, anamnese, SOAP), estoque clínico, protocolos clínicos |
| `VET` | `Pet` (espécie, raça, porte), agenda com `petId`, carteira vacinal, aba Pets, overview clínico pet |
| `DENTAL` | Labels odontológicos, estoque clínico, protocolos clínicos, catálogo odonto (canal, implante, orto) |
| `LEGAL` | Dossiê, hora técnica, catálogo jurídico (parecer, LGPD, trabalhista), tab Insumos |
| `SPA` | Sessões wellness, catálogo spa (massagem, yoga, day spa), tab Insumos spa |
| `EDUCATION` | Aulas/sessões, histórico pedagógico, catálogo educacional, tab Materiais |

---

## Canais recomendados por segmento

| Nicho | Canal primário | Canal secundário | Conteúdo |
|-------|----------------|------------------|----------|
| `MEDICAL` | Outbound RH/CFO LinkedIn | Eventos RH, consultorias benefícios | ROI 87%, Portal PJ |
| `VET` | Parcerias pet corporativo (Guapeco-like) | Redes franquia pet | Auxílio pet, transparência tutor |
| `DENTAL` | Corretoras de benefícios | Associações odontológicas | Odonto sem desperdício |
| `LEGAL` | OAB regional, comunidades LegalTech | B2B compliance | Hora técnica auditável |
| `SPA` | RH People / NR-1 | Redes spa (Buddha-like) | Wellness por sessão |
| `EDUCATION` | L&D corporativo | Mentorias / escolas | Crédito aula vs. assinatura ociosa |

---

## CTAs por segmento (landing)

| Nicho | CTA primário recomendado | URL campanha (hero) |
|-------|--------------------------|---------------------|
| Todos | Demo segmentada `/?tenant={slug}` | `/` |
| `MEDICAL` | "Calcular economia para minha empresa" | `/?utm_segment=medical` |
| `VET` | "Ver auxílio pet transparente" | `/?utm_segment=vet` |
| `DENTAL` | "Odonto corporativo sem mensalidade ociosa" | `/?utm_segment=dental` |
| `LEGAL` | "Auditar horas técnicas em tempo real" | `/?utm_segment=legal` |
| `SPA` | "Wellness pago por sessão utilizada" | `/?utm_segment=spa` |
| `EDUCATION` | "Crédito educacional por aula realizada" | `/?utm_segment=education` |

Hero personalizado via `utm_segment` ou `segment`. Calculadora ROI com preset por nicho em `#roi`. Ver [`CALCULADORA_ROI.md`](CALCULADORA_ROI.md).

---

## Próximos passos do trabalho por segmento

| # | Entrega | Status |
|---|---------|--------|
| 1 | `COMERCIAL.md` em cada pasta de segmento | ✅ |
| 2 | Planos de campanha Q3 2026 por nicho | ✅ [`CAMPANHAS_Q3_2026.md`](CAMPANHAS_Q3_2026.md) |
| 3 | ROI modelado por vertical (além de saúde) | ✅ presets calculadora · doc formal ROI_REFERENCIA só saúde |
| 4 | Battle cards (1 página vs. concorrente) | ✅ em cada `CAMPANHA_*_Q3_2026.md` |
| 5 | Scripts de demo gravados (`docs/evidencias/`) | Parcial |
| 6 | Copy A/B na landing por `niche` | ✅ hero `utm_segment` |

---

## Referências

| Documento | Uso |
|-----------|-----|
| [`BENCHMARKS_POR_NICHO.md`](BENCHMARKS_POR_NICHO.md) | Concorrentes e prós/contras por vertical |
| [`../segmentos/README.md`](../segmentos/README.md) | Índice de segmentos |
| [`../pesquisa/09-sintese-consultor-senior.md`](../pesquisa/09-sintese-consultor-senior.md) | Script CFO saúde |
| [`../plataforma/BENCHMARK.md`](../plataforma/BENCHMARK.md) | POC vs. mercado |
| [`../produto/JORNADA_CLIENTE.md`](../produto/JORNADA_CLIENTE.md) | UX por portal |
