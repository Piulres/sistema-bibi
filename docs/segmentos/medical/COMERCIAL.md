# Comercial — Saúde (`MEDICAL`)

| Meta | Valor |
|------|-------|
| **Codinome** | vertical saúde (ex-codinome interno v1.x) |
| **Tenant demo** | Clínica Horizonte · `/?tenant=horizonte` ou `/` |
| **Pesquisa** | [`pesquisa-expansao-2026.md`](./pesquisa-expansao-2026.md) |
| **Features comuns** | [`../../comercial/MODULOS_COMUNS.md`](../../comercial/MODULOS_COMUNS.md) |

---

## ICP (cliente ideal)

| Perfil | Porte | Dor |
|--------|-------|-----|
| **RH / CFO** corporativo | 100–1.000 colaboradores | Plano de saúde com reajuste opaco e baixa utilização |
| **Operadora / rede credenciada** | Médio porte | Faturamento por uso sem ERP hospitalar |
| **Clínica com contrato B2B** | 5–50 prestadores | Operação + faturamento corporativo integrados |

**Decisor:** CFO (economia) + RH (benefício) + TI (integração).

---

## Proposta de valor (segmento)

> Eliminar a **caixa preta da sinistralidade** — cobrar só pelas consultas realizadas, com preço congelado no ato e auditoria total pelo Portal PJ.

**Elevator pitch:**  
*"Seu plano cobra R$ 350 por vida mesmo quando ninguém consulta. O ServiceOS cobra R$ 272 por consulta realizada — e o RH vê cada uma em tempo real."*

---

## Técnicas de captação e vendas

| Fase | Técnica | Execução |
|------|---------|----------|
| **Topo** | Conteúdo ROI 87% | Post/landing com tabela 500 vidas × 15% uso |
| **Meio** | Webinar "CFO sem caixa preta" | Demo Portal PJ + TechCorp |
| **Fundo** | Piloto 90 dias | 1 empresa, relatório mensal de consumo |
| **Fechamento** | Pergunta dos R$ 10 mi | "Quanto de economia comprovada você precisa ver?" |

**Script gancho:** *"Seu plano reajustou ~20% este ano e você não sabe exatamente por quê, certo?"*

**Demo obrigatória:** `/pj` com `rh@techcorp.com` → consumo por beneficiário → desconto corporativo 15%.

Ver [`../../pesquisa/09-sintese-consultor-senior.md`](../../pesquisa/09-sintese-consultor-senior.md).

---

## Features individuais (este segmento)

Além das [features comuns](../../comercial/MODULOS_COMUNS.md):

| Feature | Status | Valor comercial |
|---------|:------:|-----------------|
| **TISS XML** (guia simplificada) | 🟡 POC | Interoperabilidade operadoras |
| **Telemedicina** (link sala) | 🟡 mock | Consulta remota no fluxo |
| **PEP médico** (evolução SOAP, anamnese, receita, atestado) | ✅ | Operação clínica table stakes |
| **Estoque clínico** | ✅ | Insumos e medicamentos |
| **Protocolos clínicos** | ✅ | Padronização de atendimento |
| **Campo `tissCode`** em procedimentos | ✅ | TUSS no catálogo |
| **ROI documentado 87%** | ✅ doc | Principal arma CFO |

---

## Features comuns (referência rápida)

Pay Per Use · Price Snapshot · 4 portais · precificação B2B · white label · CRM · webhooks · API · RBAC · MFA · LGPD.

---

## Argumento financeiro (cenário referência)

| Modelo | 500 vidas, 15% uso (75 consultas/mês) |
|--------|---------------------------------------|
| Plano fechado | ~R$ 175.000/mês |
| ServiceOS Pay Per Use | ~R$ 23.400/mês |
| **Economia** | **~87%** (cenário modelado) |

Fonte: [`../../plataforma/ROI_REFERENCIA.md`](../../plataforma/ROI_REFERENCIA.md).

---

## Concorrentes a enfrentar

| Player | Por quê |
|--------|---------|
| Conexa, Vitta, Pipo Saúde | Mesmo território transacional B2B |
| ERPMed | Referência Pay Per Use |

**Não enfrentar:** Tasy, MV, Benner (hospitalar enterprise).

---

## CTAs recomendados

| Canal | CTA |
|-------|-----|
| Landing saúde | "Calcular economia para minha empresa" |
| Hero | Demo `faturamento@bibi.health` + Portal PJ |
| WhatsApp | "Quero piloto saúde corporativa para [N] vidas" |

---

## Gaps comerciais (qualificar na venda)

- Memed (prescrição digital) — roadmap  
- SBIS PEP — roadmap enterprise  
- PIX/WhatsApp produção — mock hoje  

---

## Próximas entregas comerciais

- [ ] Calculadora ROI interativa na landing saúde  
- [ ] Battle card vs. Conexa / Vitta  
- [ ] Vídeo demo Portal PJ (3 min)  
