# Calculadora ROI — homepage e materiais comerciais

Documentação da **calculadora interativa** na home (`#roi`) e das fórmulas reutilizáveis em materiais de vendas.

> **Política:** cenários são **modelados** (INFERÊNCIA), não promessa contratual. Preços do seed = FATO.

---

## Onde está no produto

| Artefato | Caminho |
|----------|---------|
| Lógica pura | `src/lib/landing/roi-calculator.ts` |
| UI (client) | `src/components/landing/LandingRoiCalculator.tsx` |
| Testes | `tests/unit/roi-calculator.test.ts` |
| Referência saúde | [`../plataforma/ROI_REFERENCIA.md`](../plataforma/ROI_REFERENCIA.md) |

---

## Fórmulas

```
consultas_ou_unidades = elegíveis × (utilização% ÷ 100)
custo_tradicional     = elegíveis × ticket_tradicional_mensal
custo_variavel_ppu    = unidades × preço_unitário (Price Snapshot)
custo_ppu_total       = custo_variavel_ppu + taxa_plataforma
economia_mensal       = max(0, custo_tradicional - custo_ppu_total)
economia_%            = economia_mensal ÷ custo_tradicional × 100
economia_anual        = economia_mensal × 12
```

**Interpretação da utilização:** percentual de elegíveis que realizam **1 unidade no mês** (ex.: 15% de 500 = 75 consultas).

---

## Presets por segmento

| Segmento | Ticket tradicional | Preço unidade | Taxa plataforma | Default elegíveis | Default uso |
|----------|-------------------|---------------|-----------------|-------------------|-------------|
| MEDICAL | R$ 350/vida | R$ 272/consulta | R$ 3.000 | 500 | 15% |
| VET | R$ 80/tutor | R$ 150/atendimento | R$ 2.000 | 300 | 20% |
| DENTAL | R$ 40/vida | R$ 200/procedimento | R$ 2.000 | 500 | 15% |
| LEGAL | R$ 4.000/contrato | R$ 500/hora | R$ 3.000 | 10 | 30% |
| SPA | R$ 80/vida | R$ 120/sessão | R$ 2.000 | 300 | 20% |
| EDUCATION | R$ 50/vida | R$ 150/aula | R$ 2.000 | 200 | 15% |

Fontes: [`ROI_REFERENCIA.md`](../plataforma/ROI_REFERENCIA.md) + pesquisas em `docs/segmentos/*/pesquisa.md`.

---

## Hero personalizado por campanha

Query params aceitos na home:

| Param | Exemplo | Efeito |
|-------|---------|--------|
| `utm_segment` | `?utm_segment=vet` | Hero e copy do segmento |
| `segment` | `?segment=legal` | Alias de `utm_segment` |

Implementação: `src/lib/landing/hero-variants.ts` · componente `LandingHeroProduct.tsx`.

**Slugs aceitos:** `medical`, `saude`, `vet`, `veterinaria`, `dental`, `odonto`, `legal`, `juridico`, `spa`, `wellness`, `education`, `educacao`.

---

## Uso em vendas

1. Abrir `/?utm_segment=vet` em call com RH pet.  
2. Ajustar calculadora ao tamanho da empresa ao vivo.  
3. Exportar print da tabela + link Portal PJ demo.  
4. Qualificar escopo (ambulatorial vs. internação; sessão vs. assinatura).

---

## Manutenção

Ao alterar preços no seed (`pricing-market.ts`, `niche-catalogs.ts`):

1. Atualizar presets em `roi-calculator.ts`.  
2. Atualizar [`ROI_REFERENCIA.md`](../plataforma/ROI_REFERENCIA.md).  
3. Rodar `npm test -- roi-calculator`.
