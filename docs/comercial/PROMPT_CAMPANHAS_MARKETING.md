# Prompt — Iniciar campanhas de marketing (ServiceOS)

Use este documento como **prompt base** para o agente Cursor (ou para briefing humano) ao planejar e executar campanhas de captação do **Sistema Bibi - ServiceOS v2.0**.

> **Contexto do produto:** [`README.md`](README.md) · **Estratégia por nicho:** [`ESTRATEGIA_SEGMENTOS.md`](ESTRATEGIA_SEGMENTOS.md) · **Benchmarks:** [`BENCHMARKS_POR_NICHO.md`](BENCHMARKS_POR_NICHO.md) · **Homepage:** [`PLANO_HOMEPAGE.md`](PLANO_HOMEPAGE.md)

---

## Prompt copiável (início de campanha)

Cole no chat do agente e preencha os campos entre colchetes:

```text
Você é um estrategista de marketing B2B para o Sistema Bibi - ServiceOS v2.0
(plataforma Pay Per Use multi-nicho: saúde, vet, odonto, jurídico, spa, educação).

## Objetivo da campanha
- Nicho alvo: [MEDICAL | VET | DENTAL | LEGAL | SPA | EDUCATION]
- ICP: [ex.: CFO/RH PME 200–800 vidas]
- Meta: [ex.: 30 demos qualificadas em 60 dias]
- Orçamento: [ex.: R$ 0 orgânico | R$ 5k/mês mídia paga — só humano executa gasto]

## Entregáveis que preciso
1. Plano de campanha (canais, cronograma, mensagens por estágio do funil)
2. URLs com UTM para landing (hero + calculadora + formulário)
3. Copy: anúncio curto, post LinkedIn, e-mail outbound (3 variações)
4. Roteiro de demo de 15 min alinhado ao nicho
5. Battle card vs. [concorrente ou "plano fechado tradicional"]
6. KPIs e eventos dataLayer a monitorar

## Restrições (obrigatórias)
- Números de ROI (~87%) são CENÁRIO MODELADO — marcar como INFERÊNCIA, não promessa
- Nomenclatura oficial: Sistema Bibi - ServiceOS (não usar marcas legadas v1.x)
- CTAs devem apontar para demo real: https://sistema-bibi.netlify.app ou local
- Hero por segmento: /?utm_segment={medical|vet|dental|legal|spa|education}
- Formulário lead: #contato (WhatsApp + UTM)
- Consultar docs/comercial/ e docs/segmentos/{niche}/COMERCIAL.md antes de inventar features

## Referências no repositório
- docs/comercial/ESTRATEGIA_SEGMENTOS.md
- docs/comercial/BENCHMARKS_POR_NICHO.md
- docs/comercial/CALCULADORA_ROI.md
- docs/segmentos/{niche}/COMERCIAL.md
- src/lib/landing/hero-variants.ts (copy hero UTM)
- src/lib/landing/roi-calculator.ts (presets calculadora)

Comece lendo os documentos do nicho escolhido e proponha o plano em português.
```

---

## UTMs padrão por campanha

| Parâmetro | Exemplo | Uso |
|-----------|---------|-----|
| `utm_source` | `linkedin`, `google`, `email`, `evento` | Canal |
| `utm_medium` | `cpc`, `organic`, `newsletter`, `stand` | Tipo de mídia |
| `utm_campaign` | `medical-q3-cfo`, `vet-auxilio-pet` | Nome da campanha |
| `utm_content` | `hero-a`, `calc-roi`, `post-roi87` | Criativo/variação |
| `utm_term` | `sinistralidade`, `auxilio-pet` | Palavra-chave (opcional) |

### URLs de destino

| Destino | URL base | Quando usar |
|---------|----------|-------------|
| Hero segmentado | `/?utm_segment=medical&utm_source=...` | Anúncio topo de funil |
| Calculadora | `/#roi?utm_segment=vet&utm_campaign=...` | Conteúdo financeiro |
| Comparativo | `/#comparativo?utm_segment=legal&...` | Concorrência / RFP |
| Formulário | `/#contato?utm_campaign=...` | Bottom funnel |
| Demo tenant | `/segmentos/saude?tenant=...` | Pós-qualificação |

O hero lê `utm_segment` ou `segment` — ver `src/lib/landing/hero-variants.ts`.

---

## Mensagens por nicho (resumo)

| Nicho | Headline campanha | Dor | CTA primário |
|-------|-------------------|-----|--------------|
| `MEDICAL` | Pare de pagar por elegibilidade | Sinistralidade opaca | Calcular economia (#roi) |
| `VET` | Auxílio pet só pelo atendimento | Plano por tutor ocioso | Ver demo PetCare |
| `DENTAL` | Odonto sem mensalidade ociosa | Baixo uso do plano | Simular odonto corporativo |
| `LEGAL` | Hora técnica auditável | Retainer opaco | Ver Price Snapshot |
| `SPA` | Wellness por sessão usada | Gympass com <20% uso | Agendar demo NR-1 |
| `EDUCATION` | Crédito por aula realizada | Udemy/Alura ociosa | Simular L&D Pay Per Use |

Detalhes e ICP em cada `docs/segmentos/{niche}/COMERCIAL.md`. Planos operacionais: [`CAMPANHAS_Q3_2026.md`](CAMPANHAS_Q3_2026.md).

---

## Funil da homepage (v4)

```
Hero (UTM) → Stats → Prova → Problema → Solução → Demo vídeo
  → ROI (calculadora) → Cenários POC → Comparativo (mercado por UTM)
  → Para quem → Segmentos → Recursos → Portais → FAQ → Contato → CTA
```

### Eventos dataLayer (GTM)

| Evento | Quando |
|--------|--------|
| `roi_calculator_change` | Usuário altera sliders/preset |
| `lead_form_submit` | Envia formulário #contato |
| `cta_whatsapp_click` | CTA WhatsApp flutuante/hero |
| `cta_demo_click` | "Ver demonstração" |
| `cta_portals_click` | Acesso portais |

Habilitar: `NEXT_PUBLIC_MARKETING_ENABLED=true` + `NEXT_PUBLIC_GTM_ID`.

---

## Checklist antes de publicar campanha

- [ ] Copy revisada contra política de veracidade ([`README.md`](README.md#política-de-veracidade))
- [ ] UTMs testadas (hero muda com `utm_segment`)
- [ ] `NEXT_PUBLIC_SALES_WHATSAPP` configurado em produção
- [ ] Vídeo demo (opcional): `NEXT_PUBLIC_DEMO_VIDEO_URL`
- [ ] Battle card não promete feature inexistente — cruzar com `MODULOS_COMUNS.md`
- [ ] Deploy da homepage aprovado por humano (`npm run pre-release` → deploy manual)

---

## Prompts rápidos por tarefa

### Criar 3 posts LinkedIn (nicho VET)

```text
Leia docs/segmentos/vet/COMERCIAL.md e BENCHMARKS_POR_NICHO.md (seção VET).
Escreva 3 posts LinkedIn (máx. 1.300 caracteres) para RH de empresas 200–2k colaboradores.
Tom: consultivo, sem hype. Inclua CTA com UTM para /?utm_segment=vet&utm_source=linkedin.
Marque afirmações financeiras como cenário modelado.
```

### Roteiro demo 15 min (LEGAL)

```text
Monte roteiro de demo de 15 min para GC/CFO de empresa média, nicho LEGAL.
Fluxo: login interno → Price Snapshot → Portal PJ → prestador (hora técnica).
Use credenciais demo de AGENTS.md. Inclua falas do vendedor e "momento uau".
```

### E-mail outbound (MEDICAL)

```text
E-mail frio para CFO (assunto + corpo < 150 palavras) sobre sinistralidade e Pay Per Use.
Link: /?utm_segment=medical&utm_source=email&utm_campaign=cfo-outbound-q3
Referência ROI: docs/plataforma/ROI_REFERENCIA.md — não prometer 87% como garantia.
```

---

## Manutenção

Ao alterar copy da landing ou presets da calculadora:

1. Atualizar este doc se UTMs ou funil mudarem.
2. Atualizar [`PLANO_HOMEPAGE.md`](PLANO_HOMEPAGE.md).
3. Rodar `npm run docs:verify`.
