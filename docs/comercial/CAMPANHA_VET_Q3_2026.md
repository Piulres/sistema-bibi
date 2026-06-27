# Campanha VET Q3 2026 — Sistema Bibi - ServiceOS

Plano operacional de captação B2B para **auxílio pet corporativo** (`VET` / PetOS).

| Campo | Valor |
|-------|-------|
| **Nicho** | `VET` |
| **ICP** | RH Benefits + dono de rede pet · **200–2.000 colaboradores** com auxílio pet · franquias 2–20 unidades |
| **Meta** | **25 demos qualificadas em 60 dias** |
| **Orçamento** | Semanas 1–2: **R$ 0 orgânico** · Semanas 3–8: **R$ 5.000/mês** mídia paga |
| **Concorrente battle card** | Plano pet mensal por tutor + **Guapeco** |
| **Fontes** | [`segmentos/vet/COMERCIAL.md`](../segmentos/vet/COMERCIAL.md) · [`BENCHMARKS_POR_NICHO.md`](BENCHMARKS_POR_NICHO.md) §2 · [`CALCULADORA_ROI.md`](CALCULADORA_ROI.md) |

> **Política de veracidade:** economia **~54%** = cenário modelado (300 tutores, 20% uso, R$ 80/tutor vs R$ 150/atendimento + taxa). **INFERÊNCIA** — validar em piloto.

---

## 1. Plano de campanha

### Posicionamento

**Auxílio pet transparente** — pague por banho, consulta ou vacina realizados, não por tutor elegível ocioso.

**Elevator pitch:**

> *Seu benefício pet cobra por funcionário, mas só 1 em 5 leva o animal ao vet. Com Pay Per Use, você paga só quando o pet é atendido.*

### Mensagens por estágio

| Estágio | Persona | Dor | Mensagem | CTA |
|---------|---------|-----|----------|-----|
| Awareness | RH People | Plano pet fixo com baixa adesão | Tendência auxílio pet 2026 | LinkedIn → hero |
| Consideration | RH + CFO | Não sabe quanto custa por pet real | Calculadora 300 tutores × 20% uso* | `#roi` |
| Decision | Dono rede + RH | Fragmentação B2B | Demo tutor → pet → fatura | `#contato` |
| Advocacy | RH pós-piloto | Provar ROI do benefício | Relatório mensal por atendimento | Case |

### Canais (prioridade)

| Canal | Budget | Tática |
|-------|--------|--------|
| LinkedIn orgânico | R$ 0 | Posts "auxílio pet em alta" · RH + pet friendly |
| LinkedIn Ads | R$ 2.000 | RH 200–2k cols · criativo emocional (pet = família) |
| Parcerias redes pet | R$ 0 | Outbound franquias · co-marketing |
| Google Search | R$ 1.500 | "auxílio pet corporativo", "benefício pet empresa" |
| Remarketing | R$ 1.000 | Visitantes `#roi` |
| E-mail outbound | R$ 500 | 40 contatos/semana |

### Cronograma 60 dias

Semanas 1–2: setup + 4 posts + lista 150 ICPs · Semanas 3–6: ads + webinar "Auxílio pet sem mensalidade ociosa" · Semanas 7–8: otimização CPA &lt; R$ 400/demo.

---

## 2. URLs com UTM

```
# Hero
https://sistema-bibi.netlify.app/?utm_segment=vet&utm_source=linkedin&utm_medium=social&utm_campaign=vet-q3-2026&utm_content=cta-hero

# Calculadora
https://sistema-bibi.netlify.app/?utm_segment=vet&utm_source=google&utm_medium=cpc&utm_campaign=vet-q3-2026&utm_content=cta-roi#roi

# Contato
https://sistema-bibi.netlify.app/?utm_segment=vet&utm_source=email&utm_medium=outbound&utm_campaign=vet-q3-2026&utm_content=cta-contato#contato

# Pós-demo
https://sistema-bibi.netlify.app/segmentos/veterinaria?tenant=petcare&utm_campaign=vet-q3-2026
```

---

## 3. Copy

### Anúncio

**Headline:** Benefício pet sem pagar por tutor ocioso  
**Descrição:** Sistema Bibi - ServiceOS — Pay Per Use para auxílio pet. Tutor agenda para cada pet; RH audita banho, consulta ou vacina. Cenário modelado: ~54% economia vs plano fixo (300 tutores, 20% uso).*  
**CTA:** Ver demo PetCare

### Post LinkedIn

Auxílio pet virou expectativa — não diferencial.

O problema: **R$ 80/tutor/mês** para quem nunca leva o animal ao vet.

O **Sistema Bibi - ServiceOS** (PetOS):
- Entidade **Pet** — tutor com múltiplos animais (FATO)
- Agenda com `petId` obrigatório (FATO)
- **Price Snapshot** — cada banho/consulta auditável no Portal PJ

Cenário **modelado**: 300 tutores, 20% uso → ~R$ 24k/mês (fixo) vs ~R$ 11k/mês (PPU)*.

Demo: `/?tenant=petcare`

### E-mail outbound (3 variações)

**A — RH:** Assunto: Seu auxílio pet cobra por colaborador ou por atendimento?  
**B — Rede pet:** Assunto: Faturamento B2B corporativo na mesma stack da clínica  
**C — CFO:** Assunto: Quanto do benefício pet é subsídio cruzado?  

*(Corpos completos seguem template MEDICAL — substituir números e CTAs vet UTM.)*

---

## 4. Roteiro demo 15 min

| Min | Bloco | Ação |
|:---:|-------|------|
| 0–2 | Gancho | "Como o RH sabe quanto custa o benefício pet por mês?" |
| 2–5 | Tutor + Pet | `tutor@petcare.demo` → selecionar Thor/Luna |
| 5–9 | Agenda/atendimento | Banho/tosa ou consulta com `petId` |
| 9–12 | Portal PJ | `rh@techpet.demo` → consumo por tutor/pet |
| 12–15 | Fechamento | Piloto 90 dias · parceria rede credenciada |

**Interno:** `operacao@petcare.demo` · Senha: `bibi123`

---

## 5. Battle card

### vs. Plano pet mensal (People Pet / mensalidade tutor)

| | Plano fixo | ServiceOS |
|--|------------|-----------|
| Cobrança | R$/tutor/mês | R$/atendimento |
| Multi-pet | Mesmo ticket | Por pet/atendimento |
| Auditoria RH | Reembolso manual | Portal PJ tempo real |
| Prestador + B2B | Fragmentado | 4 portais unificados |

### vs. Guapeco

| | ServiceOS | Guapeco |
|--|-----------|---------|
| Motor prestador | ✅ clínica + estética | 🟡 reembolso |
| Pay Per Use nativo | ✅ | 🟡 |
| Price Snapshot | ✅ FATO | ❌ |
| ERP clínica profundo | 🟡 | ❌ |

**Quando perdemos:** marketplace B2C (Petlove) · ERP vet profundo (Vetus).

---

## 6. KPIs e dataLayer

| KPI | Meta |
|-----|------|
| Demos qualificadas | 25 |
| `roi_calculator_change` (segment=VET) | ≥ 150 |
| `lead_form_submit` | ≥ 35 |
| CPA demo | &lt; R$ 400 |

Eventos: `page_view_enriched`, `cta_whatsapp_click`, `roi_calculator_change`, `lead_form_submit`, `segment_landing_view`.

---

*Ver índice: [`CAMPANHAS_Q3_2026.md`](CAMPANHAS_Q3_2026.md)*
