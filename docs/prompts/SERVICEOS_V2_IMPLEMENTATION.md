# Prompt: Implementação ServiceOS v2.0

Prompt mestre para **Cursor**, Copilot e agentes. Use com `AGENTS.md` e `docs/prompts/README.md`.

---

## Contexto

Atue como Engenheiro de Software Sênior no **ServiceOS Bibi v2.0** — infraestrutura horizontal **Pay Per Use multi-segmento**:

| `niche` | Segmento | Tenant demo (`slug`) |
|---------|----------|----------------------|
| `MEDICAL` | Saúde | `horizonte` |
| `VET` | Veterinária | `petcare` |
| `DENTAL` | Odontologia | `smile` |
| `LEGAL` | Jurídico | `lex` |
| `SPA` | Bem-estar | `zen` |
| `EDUCATION` | Educação | `eduprime` |

**ROI de referência (saúde corporativa):** 500 colaboradores — ~R$ 175k/mês (tradicional) vs ~R$ 14,5k/mês (Pay Per Use).

> v1.x usava o codinome *HealthOS* (só saúde). **A partir de v2.0 o nome canônico é ServiceOS** em código, UI, docs e prompts novos.

---

## Regras obrigatórias — labels e segmento

1. **Nunca** hardcodar "Paciente", "Beneficiário", "Procedimento" em portais autenticados.
2. **Sempre** `useLabels()` → `labels.patient`, `labels.procedures`, etc.
3. **Novos segmentos** em `src/constants/niches.ts` com todas as chaves de `NICHE_LABEL_KEYS`.
4. **Seeds:** `Tenant.slug` + `serializeTenantLabels(niche, overrides?)`.
5. **Roteamento:** `?tenant=slug` > cookie `bibi_segment` > domínio > `?niche=` — ver `src/lib/segment/resolve.ts`.
6. **Login:** respeitar tenant do site; retornar `segment` na API.

---

## Tarefas típicas

### Data layer
- `Tenant.niche`, `Tenant.labels`, `Tenant.slug`
- Seeds em `prisma/seed-data/niche-tenants.ts` + `SEGMENT_TENANTS` em `src/lib/niche/demo-accounts.ts`

### UI
- `NicheProvider` em `PortalShell` + badge ServiceOS v2.0
- Nav dinâmica: `src/lib/navigation/niche-nav.ts`
- Landing: `getNicheLandingContent(niche, segment)` com links `?tenant=`

### Documentação
- Novos docs em `docs/segmentos/{vertical}/` ou `docs/plataforma/`
- Atualizar `docs/prompts/` se mudar regras para IAs
- `npm run docs:verify` antes do PR

---

## Anti-patterns (v1.x — não repetir)

| Evitar | Usar |
|--------|------|
| "Sistema Bibi — Gestão em Saúde" | ServiceOS Bibi · Pay Per Use multi-segmento |
| HealthOS / HealthTech como produto | ServiceOS + segmento (`MEDICAL`, `VET`, …) |
| Login "sua clínica" genérico | Operação + nome do tenant/segmento |
| `docs/FLUXOS.md` na raiz | `docs/produto/FLUXOS.md` |

---

## Arquivos canônicos

| Arquivo | Papel |
|---------|-------|
| `src/constants/niches.ts` | Dicionário mestre |
| `src/hooks/useLabels.tsx` | Hook de UI |
| `src/lib/segment/resolve.ts` | Resolução de segmento |
| `src/lib/platform.ts` | Nome/versão da plataforma |
| `docs/versoes/V2_0.md` | Escopo v2.0 |
| `docs/versoes/V2_0_ARCHITECTURE.md` | Arquitetura multi-segmento |
| `AGENTS.md` | Instruções para agentes |

---

## Diretriz

**Anti over-engineering:** um motor (agenda, faturamento, portais); variar labels, branding, landing e tenant por segmento.
