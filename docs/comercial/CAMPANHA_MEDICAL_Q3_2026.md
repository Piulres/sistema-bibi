# Campanha MEDICAL Q3 2026 — Sistema Bibi - ServiceOS

Plano operacional de captação B2B para o vertical **saúde corporativa** (`MEDICAL`).

| Campo | Valor |
|-------|-------|
| **Nicho** | `MEDICAL` |
| **ICP** | CFO + RH/Diretor de Benefícios · PME **200–800 vidas** · plano ambulatorial/tele · sinistralidade opaca |
| **Meta** | **30 demos qualificadas em 60 dias** |
| **Orçamento** | Semanas 1–2: **R$ 0 orgânico** · Semanas 3–8: **R$ 5.000/mês** mídia paga (execução humana) |
| **Concorrente battle card** | Plano fechado por vida + **Pipo Saúde** (Tier 1) |
| **Status** | Rascunho aprovado para execução |
| **Fontes** | [`segmentos/medical/COMERCIAL.md`](../segmentos/medical/COMERCIAL.md) · [`BENCHMARKS_POR_NICHO.md`](BENCHMARKS_POR_NICHO.md) §1 · [`CALCULADORA_ROI.md`](CALCULADORA_ROI.md) · [`../plataforma/ROI_REFERENCIA.md`](../plataforma/ROI_REFERENCIA.md) |

> **Política de veracidade:** economia de **~87%** = **cenário modelado** (500 vidas, 15% utilização, ambulatorial). Marcar como **INFERÊNCIA** em todo material externo — nunca promessa contratual.

---

## 1. Plano de campanha

### Posicionamento

**Sistema Bibi - ServiceOS** elimina a **caixa preta da sinistralidade**: cobrança Pay Per Use, **Price Snapshot** (preço congelado no ato) e auditoria total no **Portal PJ**.

**Elevator pitch** (de `COMERCIAL.md`):

> *Seu plano cobra R$ 350 por vida mesmo quando ninguém consulta. O ServiceOS cobra R$ 272 por consulta realizada — e o RH vê cada uma em tempo real.*

### Funil homepage v4 (pós-merge comercial)

```
Hero (utm_segment=medical) → Stats → Prova social → Problema → Solução
  → Demo vídeo → ROI (calculadora #roi) → Cenários POC → Comparativo (#comparativo)
  → Para quem → Segmentos → Recursos → Portais → FAQ → Contato (#contato) → CTA
```

Ver [`PLANO_HOMEPAGE.md`](PLANO_HOMEPAGE.md).

### Mensagens por estágio

| Estágio | Persona | Dor | Mensagem | CTA |
|---------|---------|-----|----------|-----|
| **Awareness** | RH Benefits | Só vê boleto; não sabe quem usa | Transparência por CPF + procedimento | Post LinkedIn → hero UTM |
| **Consideration** | CFO | Reajuste ~20% sem explicação | Cenário modelado ~87% vs plano fixo* | `#roi` calculadora |
| **Decision** | RH + CFO | Medo de mais um portal | 4 portais + piloto 90 dias | Demo 15 min + `#contato` |
| **Advocacy** | RH pós-piloto | Provar economia internamente | Contrafactual R$ 350/vida vs uso real | Case + referral |

### Canais e budget (R$ 5k/mês — semanas 3–8)

| Canal | Budget/mês | Objetivo | Tática |
|-------|------------|----------|--------|
| LinkedIn orgânico + Sales Navigator | R$ 0 | Autoridade | 3 posts/semana · comentários em threads de benefícios |
| LinkedIn Ads | R$ 2.000 | Demos qualificadas | Lead Gen → Calendly · criativo CFO |
| Google Search | R$ 2.000 | Intenção alta | "sinistralidade RH", "pay per use saúde corporativa" |
| Remarketing Meta | R$ 800 | Recuperar `#roi` | "Viu a calculadora?" |
| E-mail outbound | R$ 200 | Ferramentas | 50 contatos/semana · 3 variações A/B/C |

### Cronograma 60 dias

| Semana | Foco | Entregável |
|--------|------|------------|
| 1 | Setup | UTMs validadas · GTM Preview · lista 200 ICPs · battle card |
| 2–3 | Orgânico | 6 posts LinkedIn · 100 e-mails outbound |
| 4–6 | Pago | Ads live · remarketing · webinar "CFO sem caixa preta" |
| 7–8 | Otimização | Cortar CPA > R$ 400/demo · dobrar budget no vencedor |
| 9 | Retro | Dashboard GA4 + pipeline CRM |

### Funil esperado (INFERÊNCIA)

| Etapa | Volume | Taxa |
|-------|--------|------|
| Visitantes landing | 3.000 | — |
| Clique WhatsApp/demo | 450 | 15% |
| Demo agendada | 45 | 10% |
| Demo qualificada | **30** | 67% show rate |
| Piloto 90 dias | 5 | 17% |

---

## 2. URLs com UTM

Base: `https://sistema-bibi.netlify.app`

### Hero

```
https://sistema-bibi.netlify.app/?utm_segment=medical&utm_source=linkedin&utm_medium=social&utm_campaign=medical-q3-2026&utm_content=cta-hero
```

### Calculadora ROI (`#roi`)

```
https://sistema-bibi.netlify.app/?utm_segment=medical&utm_source=google&utm_medium=cpc&utm_campaign=medical-q3-2026&utm_content=cta-roi#roi
```

### Formulário / contato (`#contato`)

```
https://sistema-bibi.netlify.app/?utm_segment=medical&utm_source=email&utm_medium=outbound&utm_campaign=medical-q3-2026&utm_content=cta-contato#contato
```

### Comparativo mercado (`#comparativo`)

```
https://sistema-bibi.netlify.app/?utm_segment=medical&utm_source=linkedin&utm_medium=paid_social&utm_campaign=medical-q3-2026&utm_content=cta-comparativo#comparativo
```

### Pós-qualificação (tenant demo)

```
https://sistema-bibi.netlify.app/segmentos/saude?utm_segment=medical&utm_source=email&utm_campaign=medical-q3-2026&utm_content=post-demo
```

**Notas técnicas:**

- `utm_segment=medical` altera hero via `hero-variants.ts` — ver [`CALCULADORA_ROI.md`](CALCULADORA_ROI.md).
- UTMs persistem em `sessionStorage` e enriquecem mensagem WhatsApp ([`../plataforma/MARKETING_CAMPAIGNS.md`](../plataforma/MARKETING_CAMPAIGNS.md)).

---

## 3. Copy pronta

### A) Anúncio (LinkedIn / Google)

**Headline:** Pare de pagar por 500 vidas ociosas  
**Descrição:** Sistema Bibi - ServiceOS — Pay Per Use para saúde corporativa. Cenário modelado: ~87% de economia vs plano fixo (500 colaboradores, 15% uso).* Portal PJ audita cada consulta.  
**CTA:** Agendar demonstração  
**Nota:** *Cenário modelado — não constitui promessa de resultado.

### B) Post LinkedIn (orgânico)

Seu plano reajustou ~20% este ano. Você sabe exatamente **quem** gerou esse custo?

Na maioria das PMEs com 200–800 vidas, o RH recebe boleto + PDF trimestral. O CFO aprova reajuste sem granularidade por colaborador.

O **Sistema Bibi - ServiceOS** inverte a lógica:

- **Pay Per Use** — cobra só consultas realizadas  
- **Price Snapshot** — preço travado no ato (FATO produto)  
- **Portal PJ** — CPF + procedimento + valor em tempo real (FATO demo TechCorp)

Cenário **modelado** (500 vidas, 15% uso): ~R$ 175k/mês (plano fixo) → ~R$ 23,4k/mês (uso + plataforma) = **~87% no modelo***.

Escopo: ambulatorial/tele — não substitui internação.

**CTA:** Comente "ROI" ou acesse a calculadora → link hero UTM.

### C) E-mail outbound — 3 variações

**A — Gancho reajuste (CFO)**  
Assunto: [Empresa] — reajuste do plano sem explicação por CPF?

Olá {{Nome}},

Empresas com {{vidas}} colaboradores costumam pagar R$ 280–400/vida/mês no ambulatorial — independente de quem usa.

No **Sistema Bibi - ServiceOS**, o RH vê consumo por colaborador no Portal PJ. Pay Per Use + preço congelado no atendimento.

Cenário **modelado** (500 vidas, 15% uso): economia de **~87%** vs plano fixo* — auditável, não promessa contratual.

15 min para mostrar TechCorp demo?

{{Link #contato}}

---

**B — Transparência (RH Benefits)**  
Assunto: Consegue listar os 10 maiores usuários do plano?

{{Nome}},

Pergunta rápida: CPF + procedimento + valor **antes** da renovação?

ServiceOS: 4 portais sobre o mesmo motor Pay Per Use. Piloto sugerido: **90 dias**, baseline vs contrafactual.

Demo 15 min?

{{Link #roi}}

---

**C — vs plano fechado**  
Assunto: E se 85% do quadro parasse de subsidiar os 15%?

Modelo por vida = subsídio cruzado. Pay Per Use = caixa acompanha demanda.

Cenário modelado ~87%* para 500 vidas / baixa utilização. Ambulatorial — não hospitalar.

Agenda aberta?

{{Link hero}}

---

## 4. Roteiro demo 15 min

**Participantes:** RH Benefits + CFO (ou proxy financeiro)  
**Credenciais:** `rh@techcorp.com` · `faturamento@bibi.health` · senha `bibi123`

| Min | Bloco | Ação | Fala-chave |
|:---:|-------|------|------------|
| 0–2 | Gancho | Diagnóstico | "Como recebem hoje o dado de utilização?" |
| 2–4 | Problema | `#roi` ou slide | "Plano fixo ~R$ 175k vs uso ~R$ 23,4k — **cenário modelado***" |
| 4–8 | Portal PJ | Login `rh@techcorp.com` | "CPF, procedimento, desconto 15% TechCorp" |
| 8–11 | Price Snapshot | 1 `ProcedureUsage` | "Preço travado no ato — sem glosa posterior" (FATO) |
| 11–13 | Beneficiário | `joao.pereira@email.com` | Self-service reduz carga RH |
| 13–15 | Fechamento | Piloto 90 dias | "Quanto de economia **nos dados** para trocar custo fixo?" |

**Objeções:** internação (complementa ambulatorial) · LGPD (export + auditoria) · Memed (roadmap).

Script completo: [`../pesquisa/09-sintese-consultor-senior.md`](../pesquisa/09-sintese-consultor-senior.md) §3.

---

## 5. Battle card

### vs. Plano fechado por vida

| Critério | Plano fechado | Sistema Bibi - ServiceOS |
|----------|---------------|--------------------------|
| Modelo | R$ X/vida/mês fixo | Fee plataforma + evento |
| Desperdício vidas ociosas | Alto | Baixo |
| Transparência | Boleto + relatório tardio | Portal PJ tempo real |
| Preço no atendimento | Tabela operadora/reajuste ANS | **Price Snapshot** (FATO) |
| Escopo | Full (se operadora) | Ambulatorial/tele POC |
| ROI comunicável | Reajuste histórico | **~87% modelado*** |

**Perdemos quando:** internação + operadora full risk + rede nacional.  
**Ganhamos quando:** 200–800 vidas, baixa/média utilização, CFO pressionado por reajuste.

### vs. Pipo Saúde

| | ServiceOS | Pipo |
|--|-----------|------|
| Core | Infraestrutura Pay Per Use | Corretora + benefícios |
| Cobrança | Por evento nativo | Por vida / pacote tele |
| Auditoria | CPF + procedimento + valor/evento | Sinistro agregado |
| Price Snapshot | ✅ FATO | ❌ |
| Populacional / crônicos | ❌ POC | ✅ forte |
| Multi-nicho | ✅ 6 verticais | ❌ saúde |

**Argumento:** "Pipo otimiza sinistralidade dentro do modelo por vida. ServiceOS **muda o modelo**."

**Contra-argumento:** "Case −21% reajuste." → **Resposta:** "Mostre economia **por evento** no piloto 90 dias."

Detalhe: [`BENCHMARKS_POR_NICHO.md`](BENCHMARKS_POR_NICHO.md) §1 · [`../pesquisa/01-matriz-competitiva.md`](../pesquisa/01-matriz-competitiva.md).

---

## 6. KPIs e eventos dataLayer

### KPIs de campanha

| KPI | Meta 60d | Fonte |
|-----|----------|-------|
| Demos qualificadas | **30** | CRM |
| CPA demo | < R$ 350 | Ads |
| Hero → WhatsApp | ≥ 8% | GTM |
| Hero → demo login | ≥ 5% | GTM |
| Visitantes `#roi` | ≥ 800 | GA4 |
| `roi_calculator_change` | ≥ 200 | dataLayer |
| `lead_form_submit` | ≥ 40 | dataLayer |
| SQLs piloto 90d | 5 | CRM |

### Eventos implementados (`src/lib/marketing/data-layer.ts`)

| Evento | Quando | Variáveis GTM |
|--------|--------|---------------|
| `page_view_enriched` | Page load com UTM | `utm_*`, `page_path` |
| `cta_whatsapp_click` | WhatsApp hero/footer | `cta_location`, `utm_*` |
| `cta_demo_click` | "Acessar demonstração" | `cta_location` |
| `cta_portals_click` | Explorar portais | `cta_location` |
| `segment_landing_view` | `/segmentos/*` | `segment_slug`, `niche` |
| `roi_calculator_change` | Slider/preset calculadora | `segment`, `eligible`, `utilization_pct`, `savings_pct` |
| `lead_form_submit` | Formulário `#contato` | `segment`, `utm_*` |

### Ativação produção

```env
NEXT_PUBLIC_MARKETING_ENABLED=true
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
NEXT_PUBLIC_SALES_WHATSAPP=+5511970828949
```

Checklist pré-publicação: [`PROMPT_CAMPANHAS_MARKETING.md`](PROMPT_CAMPANHAS_MARKETING.md#checklist-antes-de-publicar-campanha).

---

## Checklist de execução humana

- [ ] Revisar copy contra política FATO/INFERÊNCIA
- [ ] Testar `/?utm_segment=medical` (hero segmentado)
- [ ] GTM Preview com todos os eventos acima
- [ ] Configurar Calendly + CRM para contagem de demos
- [ ] `npm run pre-release` → deploy manual (humano)
- [ ] Ativar budget pago apenas após validação local

---

*Plano gerado a partir da documentação comercial mergeada na `dev`. Complementa [`PROMPT_CAMPANHAS_MARKETING.md`](PROMPT_CAMPANHAS_MARKETING.md).*
