# Campanhas de marketing — ServiceOS

Guia para links UTM, tags e rastreamento de conversão na landing pública.

**Variáveis:** [`VARIAVEIS_AMBIENTE.md`](VARIAVEIS_AMBIENTE.md) · **Código:** `src/lib/marketing/`

---

## Ativar tags em produção

1. Defina no painel Netlify (ou `.env` local):

```env
NEXT_PUBLIC_MARKETING_ENABLED=true
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
NEXT_PUBLIC_SALES_WHATSAPP=+5511970828949
```

2. No **Google Tag Manager**, configure:
   - Tag GA4 Page View
   - Tag de conversão no evento `cta_whatsapp_click`
   - Pixel Meta (ou use `NEXT_PUBLIC_META_PIXEL_ID` direto)

3. Valide com **GTM Preview** antes de publicar o container.

> **LGPD:** tags ficam desligadas por padrão (`MARKETING_ENABLED=false`). Banner de cookies (CMP) é fase 2.

---

## Convenção UTM

| Parâmetro | Exemplo | Uso |
|-----------|---------|-----|
| `utm_source` | `linkedin`, `google`, `email` | Origem do tráfego |
| `utm_medium` | `cpc`, `social`, `newsletter` | Canal |
| `utm_campaign` | `proposta-q2-2026` | Nome da campanha |
| `utm_content` | `cta-hero`, `cta-footer` | Variação do criativo |
| `utm_term` | `pay-per-use-b2b` | Palavra-chave (Ads) |

Os parâmetros são capturados na sessão (`sessionStorage`) e:
- enriquecem o `dataLayer` (`page_view_enriched`)
- são anexados à mensagem do WhatsApp ao clicar em **Fale com um especialista**

---

## Links prontos para campanhas

Substitua o domínio se usar preview Netlify.

### Home — LinkedIn

```
https://sistema-bibi.netlify.app/?utm_source=linkedin&utm_medium=social&utm_campaign=proposta-2026&utm_content=hero
```

### Segmento Saúde — Google Ads

```
https://sistema-bibi.netlify.app/segmentos/saude?utm_source=google&utm_medium=cpc&utm_campaign=health-b2b&utm_term=pay+per+use
```

### Proposta comercial — E-mail

```
https://sistema-bibi.netlify.app/venda?utm_source=email&utm_medium=newsletter&utm_campaign=proposta-q2&utm_content=footer-cta
```

### Footer CTA — remarketing

```
https://sistema-bibi.netlify.app/?utm_source=meta&utm_medium=paid_social&utm_campaign=remarketing-2026&utm_content=cta-footer
```

---

## Eventos `dataLayer` (GTM)

| Evento | Quando dispara |
|--------|----------------|
| `page_view_enriched` | Carregamento de página com UTM na sessão |
| `roi_calculator_change` | Usuário altera sliders/preset na calculadora `#roi` |
| `lead_form_submit` | Envia formulário `#contato` |
| `cta_whatsapp_click` | Clique em **Fale com um especialista** |
| `cta_demo_click` | Clique em **Acessar demonstração** ou API |
| `cta_portals_click` | Clique em **Acessar portais** / **Explorar portais** |
| `segment_landing_view` | Visualização de `/segmentos/*` |

**Análise diária:** funil, GA4 e planilha CRM — [`../comercial/ANALISE_DIARIA.md`](../comercial/ANALISE_DIARIA.md).

### Payloads úteis (GTM variables)

| Evento | Campos |
|--------|--------|
| `roi_calculator_change` | `segment`, `eligible`, `utilization_pct`, `savings_pct`, `page_path` |
| `lead_form_submit` | `segment`, `page_path`, `utm_*` |
| `cta_whatsapp_click` | `cta_location`, `page_path`, `utm_*` |
| `segment_landing_view` | `segment_slug`, `niche`, `utm_*` |

### Exemplo de trigger GTM (WhatsApp)

- **Tipo:** Evento personalizado
- **Nome do evento:** `cta_whatsapp_click`
- **Variáveis:** `cta_location`, `page_path`, `utm_*` (via dataLayer)

---

## SEO complementar

- Imagem OG padrão: `/og/serviceos-default.png` (1200×630)
- Sitemap: `/sitemap.xml` (home, segmentos, venda, plataforma)
- JSON-LD: `Organization` + `ContactPoint` (WhatsApp vendas) + `WebSite` + `SoftwareApplication`

Validar após deploy:
- [Rich Results Test](https://search.google.com/test/rich-results)
- [Meta Sharing Debugger](https://developers.facebook.com/tools/debug/)
