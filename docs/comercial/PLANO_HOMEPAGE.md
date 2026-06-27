# Plano — Homepage mais atrativa (captação)

Documento de planejamento e registro das mudanças aplicadas na home (`/`) para aumentar conversão de visitantes em demo e leads comerciais.

> **Benchmarks por nicho:** [`BENCHMARKS_POR_NICHO.md`](BENCHMARKS_POR_NICHO.md)

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

---

## Objetivos

1. **Clareza imediata** — dor (caixa preta) → solução (Pay Per Use) → prova (ROI 87%).
2. **ICP visível** — quem se beneficia, sem ir para `/venda`.
3. **Funil de conversão** — problema antes de features; segmentos antes de portais técnicos.
4. **CTAs orientados a valor** — demonstração e segmento, não jargão de produto.

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

### Stats (faixa abaixo do hero)

| Antes | Depois |
|-------|--------|
| 4 portais, Pay Per Use, 100% nuvem, LGPD | ~87% economia, 6 segmentos, 4 portais, Price Snapshot |

### Nova seção

- **`#para-quem`** — Propósitos + público-alvo (`SALES_SITE_SECTIONS`) na home.

### Reordenação das seções

```
Hero → Stats → Problema → Solução → ROI → Para quem → Segmentos → Recursos → Portais → FAQ → Novidades → CTA
```

### Navegação (header)

```
Solução · ROI · Para quem · Segmentos · Portais · FAQ
```

(removido do nav principal: Produto, Visão, Valores, Novidades — ainda acessíveis por scroll/âncoras legadas)

---

## Métricas sugeridas (pós-deploy)

| Métrica | Ferramenta | Meta inicial |
|---------|------------|--------------|
| `cta_portals_click` | dataLayer | +20% vs. baseline |
| `cta_whatsapp_click` | dataLayer | estável ou +10% |
| Scroll até `#roi` | analytics | >60% sessões |
| Cliques em cards de segmento | evento futuro | baseline |

---

## Roadmap homepage (próximas iterações)

| Fase | Entrega | Prioridade |
|------|---------|------------|
| **v2** | Calculadora ROI interativa no `#roi` | Alta |
| **v2** | Depoimentos / logos (quando houver clientes) | Alta |
| **v3** | Hero A/B por UTM (`?utm_segment=vet`) | Média |
| **v3** | Comparativo visual vs. Conexa/Wellhub (1 tabela) | Média |
| **v4** | Vídeo demo 90s embutido no hero | Média |
| **v4** | Formulário lead além do WhatsApp | Baixa |

---

## Arquivos alterados

| Arquivo | Papel |
|---------|-------|
| `src/lib/landing/home-content.ts` | Copy hero, stats, audiência |
| `src/lib/landing/content.ts` | Stats da faixa |
| `src/lib/landing/navigation.ts` | Nav da home |
| `src/components/landing/LandingHeroProduct.tsx` | CTA + destaque ROI |
| `src/components/landing/LandingHomeAudience.tsx` | Seção para quem (novo) |
| `src/components/landing/LandingHomePageView.tsx` | Ordem das seções |

---

## Validação

```bash
npm run lint
npm run docs:verify
npm run dev   # revisar / em desktop e mobile
```

*Plano vivo — atualizar ao fechar cada iteração da homepage.*
