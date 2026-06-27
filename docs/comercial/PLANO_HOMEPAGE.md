# Plano — Homepage mais atrativa (captação)

Documento de planejamento e registro das mudanças aplicadas na home (`/`) para aumentar conversão de visitantes em demo e leads comerciais.

> **Benchmarks por nicho:** [`BENCHMARKS_POR_NICHO.md`](BENCHMARKS_POR_NICHO.md)  
> **Calculadora ROI:** [`CALCULADORA_ROI.md`](CALCULADORA_ROI.md)

---

## Diagnóstico (antes)

| Problema | Impacto |
|----------|---------|
| Hero abstrato ("Infraestrutura Pay Per Use") | Visitante não entende dor em 3 segundos |
| Produto/Visão/Valores antes da dor | Hierarquia invertida para comprador |
| Changelog (#novidades) no meio da página | Sinal de produto dev, não de venda |
| Propósitos e "Para quem" só em `/venda` | ICP escondido na home principal |
| CTAs genéricos ("Acessar portais") | Alto atrito para CFO/RH não técnico |
| Stats técnicos (LGPD, multi-tenant) | Pouco emocional/financeiro |
| ROI estático | Sem engajamento interativo |
| Sem comparativo vs. mercado | Diferencial não explícito |

---

## Objetivos

1. **Clareza imediata** — dor (caixa preta) → solução (Pay Per Use) → prova (ROI 87%).
2. **ICP visível** — quem se beneficia, sem ir para `/venda`.
3. **Funil de conversão** — problema antes de features; segmentos antes de portais técnicos.
4. **CTAs orientados a valor** — demonstração e segmento, não jargão de produto.
5. **Interatividade** — calculadora e comparativo para retenção.
6. **Campanhas** — hero por `utm_segment`.

---

## Mudanças implementadas (v1)

### Copy e hero

| Elemento | Antes | Depois |
|----------|-------|--------|
| Headline | Infraestrutura Pay Per Use | Pare de pagar por elegibilidade |
| Accent | para serviços profissionais | Cobre só pelo que foi usado |
| CTA primário | Acessar portais | Ver demonstração ao vivo |
| CTA terciário | Acesso segmentado (URL) | Escolher meu segmento (#segmentos) |
| Destaque hero | — | Faixa ~87% economia (cenário referência) |

### Stats, audiência e nav

- Stats: economia 87%, 6 segmentos, 4 portais, Price Snapshot  
- Seção `#para-quem` na home  
- Nav: Solução · ROI · Para quem · Segmentos · Portais · FAQ  

### Funil v1

```
Hero → Stats → Problema → Solução → ROI → Para quem → Segmentos → Recursos → Portais → FAQ → Novidades → CTA
```

---

## Mudanças implementadas (v2 + v3)

| Entrega | Status | Detalhe |
|---------|--------|---------|
| **Calculadora ROI interativa** | ✅ | `#roi` — 6 presets por segmento, sliders, economia ao vivo |
| **Comparativo visual** | ✅ | `#comparativo` — ServiceOS vs plano fechado vs mercado |
| **Prova da plataforma** | ✅ | Faixa pós-stats — 4 portais, 6 demos, POC validada |
| **Hero A/B por UTM** | ✅ | `?utm_segment=vet` ou `?segment=legal` |
| Depoimentos / logos reais | ⏳ | Aguarda clientes em produção |
| Vídeo demo 90s | ✅ v4 | `#demo-video` — YouTube via `NEXT_PUBLIC_DEMO_VIDEO_URL` ou fallback CTA |
| Formulário lead | ✅ v4 | `#contato` — WhatsApp + UTM + evento `lead_form_submit` |
| Cenários validados POC | ✅ v4 | `#cenarios` — narrativas demo (não depoimentos reais) |
| Comparativo dinâmico por UTM | ✅ v4 | Coluna mercado muda com `utm_segment` |
| `roi_calculator_change` dataLayer | ✅ v4 | Debounce 600ms na calculadora |

### Funil atual (v4)

```
Hero (UTM) → Stats → Prova → Problema → Solução → Demo vídeo
  → ROI (calculadora) → Cenários POC → Comparativo (mercado por UTM)
  → Para quem → Segmentos → Recursos → Produto/Visão/Valores → Portais
  → FAQ → Novidades → Contato → CTA
```

### Navegação atual

```
Solução · Demo · ROI · Comparativo · Para quem · Segmentos · Portais · Contato · FAQ
```

---

## Métricas sugeridas (pós-deploy)

| Métrica | Ferramenta | Meta inicial |
|---------|------------|--------------|
| `cta_portals_click` | dataLayer | +20% vs. baseline |
| `cta_whatsapp_click` | dataLayer | estável ou +10% |
| Interação calculadora ROI | `roi_calculator_change` | baseline |
| Envio formulário contato | `lead_form_submit` | baseline |
| Scroll até `#comparativo` | analytics | >50% sessões |
| Hero `utm_segment` | UTM + sessão | por campanha |

---

## Roadmap homepage (próximas iterações)

| Fase | Entrega | Prioridade |
|------|---------|------------|
| **v5** | Depoimentos reais pós-primeiro cliente | Alta (quando houver) |
| **v5** | CRM/backend para leads (além do WhatsApp) | Média |
| **v5** | A/B test formal de headlines (ferramenta externa) | Baixa |

---

## Arquivos (v1 + v2 + v4)

| Arquivo | Papel |
|---------|-------|
| `src/lib/landing/home-content.ts` | Copy base |
| `src/lib/landing/hero-variants.ts` | Hero por segmento/UTM |
| `src/lib/landing/roi-calculator.ts` | Fórmulas e presets |
| `src/lib/landing/compare-content.ts` | Tabela comparativa + mercado por segmento |
| `src/lib/landing/lead-form.ts` | Mensagem WhatsApp do formulário |
| `src/lib/landing/scenarios-content.ts` | Cenários POC validados |
| `src/components/landing/LandingRoiCalculator.tsx` | Calculadora + tracking |
| `src/components/landing/LandingCompare.tsx` | Comparativo dinâmico |
| `src/components/landing/LandingSocialProof.tsx` | Prova da POC |
| `src/components/landing/LandingDemoVideo.tsx` | Vídeo ou fallback demo |
| `src/components/landing/LandingValidatedScenarios.tsx` | Cards cenários |
| `src/components/landing/LandingLeadForm.tsx` | Formulário #contato |
| `src/components/landing/LandingHeroProduct.tsx` | Hero + UTM |
| `src/components/landing/LandingHomePageView.tsx` | Ordem das seções |
| `docs/comercial/PROMPT_CAMPANHAS_MARKETING.md` | Prompt para campanhas |

---

## Validação

```bash
npm run lint
npm test -- roi-calculator lead-form
npm run docs:verify
npm run pre-release    # pacote completo (lint + build Netlify)
npm run dev            # / e /?utm_segment=vet
```

Registro completo: [`VALIDACAO_TESTES.md`](VALIDACAO_TESTES.md) (jun/2026 — 410 unit, pre-release OK, E2E 121/130).

*Plano vivo — atualizar ao fechar cada iteração da homepage.*
