# Próximos passos — pacote comercial Q3 2026

Checklist de execução após merge na **`dev`**. Atualizar status manualmente.

> **Análise diária:** [`ANALISE_DIARIA.md`](ANALISE_DIARIA.md) · **Campanhas:** [`CAMPANHAS_Q3_2026.md`](CAMPANHAS_Q3_2026.md) · **Release:** [`../versoes/RELEASES.md`](../versoes/RELEASES.md)

---

## Fase 1 — Validação técnica (agente / dev)

| # | Ação | Comando / artefato | Status |
|---|------|-------------------|--------|
| 1 | Lint | `npm run lint` | ✅ 2026-06-27 |
| 2 | Docs | `npm run docs:verify` | ✅ via pre-release |
| 3 | Testes comerciais | `npm test -- roi-calculator lead-form` | ✅ 7/7 |
| 4 | Pre-release | `npm run pre-release` | ✅ 2026-06-27 |
| 5 | Registro | [`VALIDACAO_TESTES.md`](VALIDACAO_TESTES.md) | ✅ |

---

## Fase 2 — Release (humano)

| # | Ação | Responsável | Status |
|---|------|-------------|--------|
| 6 | Merge `dev` → `main` (fechar pacote v2.3.x ou v2.4.0 com captação) | Humano | ☐ |
| 7 | `npm run pre-release` na `main` | Humano | ☐ |
| 8 | Deploy produção `npx netlify deploy --prod` | Humano | ☐ |
| 9 | Atualizar `RELEASES.md` + `changelog-content.ts` | Humano (pós-deploy confirmado) | ☐ |

**Produção atual:** ver [`RELEASES.md`](../versoes/RELEASES.md) — landing v4 só impacta campanhas **após deploy**.

---

## Fase 3 — Instrumentação (humano, ~1h)

| # | Ação | Status |
|---|------|--------|
| 10 | Configurar env vars marketing no Netlify | ☐ |
| 11 | Publicar container GTM (ver [`ANALISE_DIARIA.md`](ANALISE_DIARIA.md) § GTM) | ☐ |
| 12 | GTM Preview — validar 7 eventos | ☐ |
| 13 | Importar template planilha [`templates/planilha-campanhas-diaria.csv`](templates/planilha-campanhas-diaria.csv) | ☐ |
| 14 | Testar `/?utm_segment=medical` em produção | ☐ |

---

## Fase 4 — Execução comercial (humano)

| # | Ação | Prioridade sugerida | Status |
|---|------|---------------------|--------|
| 15 | Ativar campanha **MEDICAL** (orgânico semanas 1–2) | Alta | ☐ |
| 16 | Ativar **VET** + **SPA** | Média | ☐ |
| 17 | Ritual diário [`ANALISE_DIARIA.md`](ANALISE_DIARIA.md) | Contínuo | ☐ |
| 18 | Mídia paga R$ 5k/mês por nicho ativo (semana 3+) | Após fase 3 | ☐ |
| 19 | LEGAL, DENTAL, EDUCATION conforme capacidade | Baixa | ☐ |

---

## Fase 5 — Roadmap doc/produto (backlog)

| Entrega | Nicho | Doc |
|---------|-------|-----|
| Vídeo demo Portal PJ 3 min | MEDICAL | `COMERCIAL.md` |
| ROI_REFERENCIA estendido | VET, DENTAL | `CALCULADORA_ROI.md` |
| Battle cards PDF | Todos | campanhas |
| Evidências demo gravadas | Todos | `docs/evidencias/` |
| Evento GTM `qualified_demo` | Produto | CRM webhook futuro |

---

## Critério de “pacote comercial no ar”

Todos marcados:

- [ ] Deploy produção com landing v4
- [ ] GTM + GA4 recebendo eventos
- [ ] WhatsApp vendas configurado
- [ ] Planilha/CRM operacional
- [ ] Primeira campanha MEDICAL com UTMs live

---

*Última atualização: gerado com pacote comercial na `dev` @ `7da6493`.*
