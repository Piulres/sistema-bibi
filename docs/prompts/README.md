# Prompts ServiceOS v2.0 — desenvolvimento futuro

Índice canônico de prompts para **Cursor**, Copilot e pesquisa externa.

> **A partir de v2.0 o produto é ServiceOS**, não HealthOS. Menções a *HealthOS* e *HealthTech POC* aparecem apenas em documentos históricos (`docs/versoes/V1_*.md`) ou pesquisa do **segmento saúde** (`docs/segmentos/medical/`).

---

## Prompts de implementação (usar no dia a dia)

| Prompt | Quando usar |
|--------|-------------|
| [`SERVICEOS_V2_IMPLEMENTATION.md`](SERVICEOS_V2_IMPLEMENTATION.md) | **Principal** — features, labels, UI multi-segmento, seeds |
| [`SERVICEOS_CURSOR_SESSION.md`](SERVICEOS_CURSOR_SESSION.md) | Abrir sessão no Cursor / handoff entre agentes |
| [`../pesquisa/15-prompt-deep-research-nicho.md`](../pesquisa/15-prompt-deep-research-nicho.md) | Pesquisa de mercado por vertical |

---

## Prompts de pesquisa e estratégia

| Prompt | Escopo |
|--------|--------|
| [`../pesquisa/05-prompt-pesquisa-externa.md`](../pesquisa/05-prompt-pesquisa-externa.md) | Benchmark competitivo ServiceOS |
| [`../pesquisa/08-prompt-serviceos-medical.md`](../pesquisa/08-prompt-serviceos-medical.md) | ROI e expansão **segmento saúde** (ex-HealthOS) |
| [`../pesquisa/TEMPLATE_PESQUISA_NICHO.md`](../pesquisa/TEMPLATE_PESQUISA_NICHO.md) | Novo segmento vertical |

---

## Regras para agentes (não duplicar em chat)

1. **`AGENTS.md`** — glossário, credenciais, stack, segmentos
2. **`docs/versoes/V2_0.md`** — escopo v2.0
3. **`docs/segmentos/README.md`** — roteamento `?tenant=` e demos por vertical
4. **`.cursor/rules/serviceos-dev.mdc`** — invariantes ServiceOS em código

---

## Nomenclatura oficial (v2.0+)

| Usar | Não usar em código/docs novos |
|------|-------------------------------|
| **Sistema Bibi - ServiceOS** / **ServiceOS v2.0** | HealthOS, Sistema Bibi (como produto) |
| **Segmento** / `niche` / `Tenant.slug` | "clínica" genérico quando multi-segmento |
| `useLabels()` / `labels.patient` | "Paciente" hardcoded |
| `?tenant=petcare` | só `?niche=` sem tenant quando há demo |

---

## Documentação relacionada

- Índice geral: [`../README.md`](../README.md)
- Arquitetura: [`../versoes/V2_0_ARCHITECTURE.md`](../versoes/V2_0_ARCHITECTURE.md)
- Operações: [`../plataforma/OPERACOES.md`](../plataforma/OPERACOES.md)
