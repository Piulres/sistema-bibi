# Campanhas Q3 2026 — índice por nicho

Pacote de planos operacionais B2B do **Sistema Bibi - ServiceOS v2.0** — um documento por vertical.

> **Prompt base:** [`PROMPT_CAMPANHAS_MARKETING.md`](PROMPT_CAMPANHAS_MARKETING.md) · **Estratégia:** [`ESTRATEGIA_SEGMENTOS.md`](ESTRATEGIA_SEGMENTOS.md) · **Calculadora:** [`CALCULADORA_ROI.md`](CALCULADORA_ROI.md)

---

## Campanhas por nicho

| Nicho | Codinome | ICP primário | Cenário ROI (preset calculadora)* | Plano |
|-------|----------|--------------|-----------------------------------|-------|
| `MEDICAL` | vertical saúde | CFO/RH · 200–800 vidas | ~87% · 500 cols · 15% uso | [`CAMPANHA_MEDICAL_Q3_2026.md`](CAMPANHA_MEDICAL_Q3_2026.md) |
| `VET` | PetOS | RH auxílio pet · 200–2k cols | ~54% · 300 tutores · 20% uso | [`CAMPANHA_VET_Q3_2026.md`](CAMPANHA_VET_Q3_2026.md) |
| `DENTAL` | DentalOS | RH PME · 100–500 cols | ~15%† · 500 cols · 15% uso | [`CAMPANHA_DENTAL_Q3_2026.md`](CAMPANHA_DENTAL_Q3_2026.md) |
| `LEGAL` | LawOS | GC/sócio · 5–30 advogados | ~89% · 10 contratos · 30% uso | [`CAMPANHA_LEGAL_Q3_2026.md`](CAMPANHA_LEGAL_Q3_2026.md) |
| `SPA` | SpaOS | RH People · 200–1k cols | ~62% · 300 cols · 20% uso | [`CAMPANHA_SPA_Q3_2026.md`](CAMPANHA_SPA_Q3_2026.md) |
| `EDUCATION` | EduOS | L&D/RH · 100–1k cols | ~35%‡ · 200 cols · 15% uso | [`CAMPANHA_EDUCATION_Q3_2026.md`](CAMPANHA_EDUCATION_Q3_2026.md) |

\*Todos os percentuais são **cenários modelados (INFERÊNCIA)** — presets em `roi-calculator.ts`, não promessa contratual.

†Odonto: argumento principal é **table stakes sem mensalidade ociosa**; economia % sobe muito com utilização &lt;2 proc/ano (ver `COMERCIAL.md`).

‡Educação: ROI % moderado no preset; ganho comercial é **fim do shelfware** + mentoria 1:1 auditável.

---

## UTMs padrão (todos os nichos)

| Destino | Padrão URL |
|---------|------------|
| Hero | `/?utm_segment={medical\|vet\|dental\|legal\|spa\|education}&utm_campaign={niche}-q3-2026` |
| Calculadora | `/#roi?utm_segment=...&utm_content=cta-roi` |
| Contato | `/#contato?utm_segment=...&utm_content=cta-contato` |
| Comparativo | `/#comparativo?utm_segment=...&utm_content=cta-comparativo` |
| Página segmento | `/segmentos/{slug}?tenant={demo}` |

**Slugs landing:** `saude` · `veterinaria` · `odontologia` · `juridico` · `bem-estar` · `educacao`

---

## Meta transversal Q3 2026

| KPI agregado | Meta |
|--------------|------|
| Demos qualificadas (6 nichos) | **150** (~25/nicho em 60 dias) |
| Budget mídia paga (humano) | R$ 5k/mês **por nicho ativo** (priorizar 2–3 verticais) |
| Eventos GTM | `roi_calculator_change`, `lead_form_submit`, `cta_whatsapp_click` |

---

## Checklist antes de veicular

- [ ] Copy revisada (FATO vs INFERÊNCIA)
- [ ] Hero testado com `utm_segment`
- [ ] GTM Preview
- [ ] `NEXT_PUBLIC_SALES_WHATSAPP` em produção
- [ ] Deploy humano após `npm run pre-release`

---

*Manutenção: ao alterar presets da calculadora, atualizar tabela acima e o plano do nicho afetado.*
