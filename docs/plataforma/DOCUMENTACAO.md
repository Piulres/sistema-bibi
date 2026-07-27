# Documentação viva — regras para agentes e humanos

A documentação do ServiceOS é **viva**: status atual + timeline append-only.  
Evite arquivos com nome de fase, data ou número de entrega (`FASE_2`, `GO_LIVE_2026`, `HISTORICO_2026-07-25`).

---

## Onde está a verdade

| Tema | Doc canônico |
|------|----------------|
| Versão em produção / pacotes | [`../versoes/RELEASES.md`](../versoes/RELEASES.md) |
| Operações (dev, PR → `dev`, deploy) | [`OPERACOES.md`](OPERACOES.md) |
| Piloto CEDIG (status + timeline) | [`../clientes/cedig/STATUS.md`](../clientes/cedig/STATUS.md) |
| Escopo da versão atual | [`../versoes/V3_0.md`](../versoes/V3_0.md) (+ histórico `V2_*` / `V1_*`) |
| Fluxos de produto | [`../produto/FLUXOS.md`](../produto/FLUXOS.md) |
| Jornada no consultório (narrativa operacional) | [`../produto/JORNADA_CONSULTORIO.md`](../produto/JORNADA_CONSULTORIO.md) |
| Documentos clínicos (atestado, receita, protocolos) | [`../produto/DOCUMENTOS_CLINICOS.md`](../produto/DOCUMENTOS_CLINICOS.md) |
| Changelog da landing | [`LANDING_CHANGELOG.md`](LANDING_CHANGELOG.md) |
| Índice | [`../README.md`](../README.md) |

### Subsistema → doc (roteamento rápido)

| Subsistema alterado | Atualizar |
|---------------------|-----------|
| Prontuário / Care Chart / protocolos | `DOCUMENTOS_CLINICOS.md` · `FLUXOS.md` §3/§4.3 · `API_DOCS.md` §7 |
| Jornada PPU / stepper / abas | `FLUXOS.md` §8.9 · `JORNADA_CLIENTE.md` · `JORNADA_CONSULTORIO.md` · `src/lib/flow-improvements-map.ts` |
| Landing nav / marca / changelog home | `DESIGN_SYSTEM.md` · `BRANDING.md` · `LANDING_CHANGELOG.md` · `src/lib/landing/navigation.ts` |
| BrandMark whitelabel (PWA, headers, OG) | `BRANDING.md` · `markText` / `PLATFORM.brandMark` · `src/lib/brand/brand-mark.ts` · `npm run icons:generate` |
| Portal nav (NavTabs, Mais, drawer) | `DESIGN_SYSTEM.md` · `ARQUITETURA_PORTAIS.md` §Navegação · `TESTES.md` (helpers E2E) |
| RBAC interno / guards API | `TESTES.md` §RBAC · `AUDITORIA_FLUXOS.md` §5 · `tests/security/rbac-gaps.test.ts` |
| Dashboard executivo (KPIs interno) | `FLUXOS.md` §4.0.1 · `ARQUITETURA.md` §15 · `ExecutiveDashboardView.tsx` |
| Gestão clínica mobile | `FLUXOS.md` §4.2.1 · `clientes/cedig/STATUS.md` · `API_DOCS.md` §8 · `ClinicFinanceView.tsx` |
| Exports tabulares / `ExportButtons` | `FLUXOS.md` §4.11 · `API_DOCS.md` §9 · `src/lib/exports/` |
| Portal PJ — CRUD colaboradores + import CSV | `FLUXOS.md` §5 · `JORNADA_CLIENTE.md` §3 · `API_DOCS.md` §10 · `pj-beneficiary-service.ts` · `pj-beneficiary-import.ts` |
| Obras / Engenharia (`CONSTRUCTION`) | `segmentos/construction/README.md` · `API_DOCS.md` §5.1 (handlers sem OpenAPI) |
| Portal header / tour / badges | `DESIGN_SYSTEM.md` · `ONBOARDING_TOUR.md` |
| Piloto CEDIG | `clientes/cedig/STATUS.md` |
| CEDIG reset / `operation.db` Blob | `OPERACAO_DADOS.md` §Limpeza/Reset · `clientes/cedig/OPERACAO.md` · `scripts/reset-cedig-transactional.mjs` · `publish-operation-blob.mjs` |

---

## Modelo por domínio de cliente

```text
docs/clientes/<slug>/
  README.md     ← quem é o cliente, preços, credenciais
  STATUS.md     ← status agora + timeline (APPEND)
  OPERACAO.md   ← playbook diário
  HOMOLOGACAO.md← checklist de aceite (se houver)
```

Ao fechar trabalho no domínio: **atualize `STATUS.md`** (tabela Status + linha na Timeline).

---

## Proibido / preferir

| Evitar | Preferir |
|--------|----------|
| `FASE_N.md`, `GO_LIVE_*.md` | Seção em `STATUS.md` |
| `HISTORICO_YYYY-MM-DD.md` | Linha na timeline |
| `STATUS.md` paralelo | Item resolvido na timeline + status |
| Snapshot `VALIDACAO_TESTES` one-shot | `TESTES.md` + `RELEASES.md` |
| Duplicar versão “em produção” em 10 arquivos | Um ponteiro a `RELEASES.md` |

---

## Checklist do agente (antes do PR)

1. `RELEASES.md` / `STATUS.md` do domínio refletem a realidade?
2. Ponteiros de produção em `docs/README.md`, `DEPLOY_NETLIFY.md` e `WORKFLOW_CURSOR.md` alinhados a `RELEASES.md` (deploy id + SHA)?
3. Links apontam para docs vivos (não arquivos removidos)?
4. Subsistema alterado tem doc correspondente? (ver tabela acima)
5. UX flow implementado? Atualizar `src/lib/flow-improvements-map.ts` (`status: "implemented"` + `docRef`); se `docRef` aponta para § de FLUXOS/JORNADA, atualizar esse §; rodar `e2e/flow-improvements.spec.ts` quando aplicável.
6. `npm run docs:verify`
7. `npm run cursor:verify` (se tocou `.cursor/` ou `AGENTS.md`)
8. PR base **`dev`** (nunca `main` direto)

Ver também: skill `.cursor/skills/serviceos-dev-quality/SKILL.md`.
