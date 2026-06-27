# Validação de testes — pacote comercial / homepage v4

Registro da execução completa de testes após a iteração **v4** (captação, formulário lead, comparativo dinâmico, prompt de campanhas).

> **Branch:** `cursor/comercial-por-segmento-c34c` · **Commit:** `fb57016` (+ fix TS `LandingLeadForm`)  
> **Data:** 2026-06-27 · **Ambiente:** Cursor Cloud Agent (Linux)

---

## Resumo executivo

| Camada | Comando | Resultado |
|--------|---------|-----------|
| Lint | `npm run lint` | ✅ OK |
| Docs | `npm run docs:verify` | ✅ OK |
| Unitário (Vitest) | `npm run test` | ✅ **410/410** (59 arquivos) |
| Comercial (subset) | `npm test -- roi-calculator lead-form marketing-utm landing-whatsapp` | ✅ **15/15** |
| Pre-release | `npm run pre-release` | ✅ OK (lint + docs + db + test + build Netlify) |
| E2E (Playwright) | `npm run test:e2e` | ⚠️ **121/130** — 9 falhas pré-existentes (onboarding bloqueia CRUD) |

**Conclusão:** o pacote comercial/homepage v4 está **validado para merge** (lint, unit, build). E2E da landing e navegação mobile passam; falhas E2E são em CRUD interno/prestador, não nas seções comerciais novas.

---

## Comandos executados

```bash
npm run lint
npm run docs:verify
npm test
npm test -- roi-calculator lead-form marketing-utm landing-whatsapp
npm run pre-release
npx playwright install chromium   # browsers ausentes na VM
npm run test:e2e
```

---

## Testes unitários — comercial / landing

| Arquivo | Casos | Escopo |
|---------|-------|--------|
| `tests/unit/roi-calculator.test.ts` | 5 | Fórmulas ROI, presets por segmento |
| `tests/unit/lead-form.test.ts` | 2 | Mensagem WhatsApp do formulário `#contato` |
| `tests/unit/marketing-utm.test.ts` | 4 | Parse/append UTM, mensagem campanha |
| `tests/unit/landing-whatsapp.test.ts` | 4 | Config e URL wa.me |

**Total subset comercial:** 15 testes — todos passando.

---

## Pre-release (pacote fechado local)

Sequência em `scripts/pre-release.mjs`:

1. `npm run lint` — OK  
2. `npm run docs:verify` — OK  
3. `npm run db:bootstrap:demo` — demo.db + operation.db  
4. `npm run db:verify` — OK  
5. `npm run test` — 410/410  
6. `npm run netlify:build` — `next build` OK  

> **Correção aplicada:** `LandingLeadForm.tsx` — guard `if (!config) return` em `handleSubmit` (TypeScript strict no build).

---

## E2E Playwright — resultado detalhado

**Config:** `e2e/` · 10 specs · 2 projetos (`chromium`, `mobile-chrome`) · **130 testes**

### Passaram (121) — inclui homepage e captação

| Spec | Testes relevantes comercial |
|------|----------------------------|
| `smoke.spec.ts` | Landing pública carrega (desktop + mobile) |
| `mobile-nav.spec.ts` | Drawer home com links de navegação (incl. novas âncoras) |
| Demais specs | Portais, RBAC, assistente, módulos internos, etc. |

### Falharam (9) — fora do escopo comercial

| Spec | Motivo provável |
|------|-----------------|
| `cadastros-crud.spec.ts` (6) | Tour de onboarding (`onboarding-root`) intercepta cliques no formulário CRUD |
| `flow-improvements.spec.ts` (2) | Link "Abrir atendimento" bloqueado por overlay / viewport |
| `walkin-particular.spec.ts` (1) | Walk-in — mesma classe de interferência de UI |

**Evidência:** log em `test-results/` — mensagem `onboarding-tooltip … intercepts pointer events`.

**Ação futura (não bloqueia v4):** helper E2E para dispensar onboarding (`localStorage` ou botão "Pular tour") antes dos testes de cadastros.

---

## Checklist manual — homepage v4

Validar em `npm run dev` (http://localhost:3000):

| # | Verificação | URL / âncora |
|---|-------------|--------------|
| 1 | Hero padrão e hero UTM | `/` e `/?utm_segment=vet` |
| 2 | Calculadora ROI interativa | `#roi` |
| 3 | Comparativo com coluna mercado por segmento | `/#comparativo?utm_segment=legal` |
| 4 | Cenários POC (não depoimentos reais) | `#cenarios` |
| 5 | Vídeo ou fallback demo | `#demo-video` |
| 6 | Formulário contato → WhatsApp | `#contato` (requer `NEXT_PUBLIC_SALES_WHATSAPP`) |
| 7 | Nav desktop/mobile com Demo e Contato | Header / drawer |

---

## Métricas dataLayer (smoke manual)

Com `NEXT_PUBLIC_MARKETING_ENABLED=true` e GTM no browser:

| Evento | Gatilho |
|--------|---------|
| `roi_calculator_change` | Alterar preset/sliders em `#roi` |
| `lead_form_submit` | Enviar formulário em `#contato` |
| `cta_whatsapp_click` | CTA flutuante WhatsApp |

---

## Referências

| Documento | Uso |
|-----------|-----|
| [`PLANO_HOMEPAGE.md`](PLANO_HOMEPAGE.md) | Escopo v4 implementado |
| [`PROMPT_CAMPANHAS_MARKETING.md`](PROMPT_CAMPANHAS_MARKETING.md) | Campanhas pós-validação |
| [`../plataforma/TESTES.md`](../plataforma/TESTES.md) | Estratégia global de testes |
| [`../evidencias/README.md`](../evidencias/README.md) | Vídeos/screenshots de fluxos |

---

*Atualizar este arquivo ao fechar cada pacote comercial ou após correção das falhas E2E de onboarding.*
