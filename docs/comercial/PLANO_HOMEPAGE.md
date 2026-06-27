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
| Vídeo demo 90s no hero | ⏳ | Roadmap v4 |
| Formulário lead | ⏳ | Roadmap v4 — WhatsApp + UTM hoje |

### Funil atual (v2)

```
Hero (UTM) → Stats → Prova → Problema → Solução → ROI (calculadora) → Comparativo
  → Para quem → Segmentos → Recursos → Produto/Visão/Valores → Portais → FAQ → Novidades → CTA
```

### Navegação atual

```
Solução · ROI · Comparativo · Para quem · Segmentos · Portais · FAQ
```

---

## Métricas sugeridas (pós-deploy)

| Métrica | Ferramenta | Meta inicial |
|---------|------------|--------------|
| `cta_portals_click` | dataLayer | +20% vs. baseline |
| `cta_whatsapp_click` | dataLayer | estável ou +10% |
| Interação calculadora ROI | evento futuro `roi_calculator_change` | baseline |
| Scroll até `#comparativo` | analytics | >50% sessões |
| Hero `utm_segment` | UTM + sessão | por campanha |

---

## Roadmap homepage (próximas iterações)

| Fase | Entrega | Prioridade |
|------|---------|------------|
| **v4** | Vídeo demo 90s embutido no hero | Média |
| **v4** | Formulário lead além do WhatsApp | Baixa |
| **v4** | Depoimentos reais pós-primeiro cliente | Alta (quando houver) |
| **v5** | `roi_calculator_change` no dataLayer | Média |
| **v5** | Comparativo dinâmico por `utm_segment` | Baixa |

---

## Arquivos (v1 + v2)

| Arquivo | Papel |
|---------|-------|
| `src/lib/landing/home-content.ts` | Copy base |
| `src/lib/landing/hero-variants.ts` | Hero por segmento/UTM |
| `src/lib/landing/roi-calculator.ts` | Fórmulas e presets |
| `src/lib/landing/compare-content.ts` | Tabela comparativa |
| `src/components/landing/LandingRoiCalculator.tsx` | Calculadora |
| `src/components/landing/LandingCompare.tsx` | Comparativo |
| `src/components/landing/LandingSocialProof.tsx` | Prova da POC |
| `src/components/landing/LandingHeroProduct.tsx` | Hero + UTM |
| `src/components/landing/LandingHomePageView.tsx` | Ordem das seções |

---

## Validação

```bash
npm run lint
npm test -- roi-calculator
npm run docs:verify
npm run dev   # / e /?utm_segment=vet
```

*Plano vivo — atualizar ao fechar cada iteração da homepage.*
