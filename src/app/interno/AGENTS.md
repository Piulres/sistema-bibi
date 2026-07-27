# Portal interno — contexto para agentes

**Layout:** `layout.tsx` · **Nav:** `InternoNav` (14 abas + gestão clínica MEDICAL/DENTAL)

## Padrão de página

Só `PageHeader` + view — shell em `layout.tsx` (não repetir `PortalShell`/`InternoNav`).

## RBAC

- Perfis: `ADMIN`, `FATURAMENTO`, `RECEPCAO`, `READONLY` (`User.internoProfile`)
- APIs: `requireInternoModule` / `requireInternoModuleWrite`
- Nav filtrada: `interno-permissions.ts` · `interno-guard.ts`
- **Conteúdo sensível (v3.0.14):** `audit-access.ts` redige timeline, export, dashboard e Cliente 360° por classe (clínico/financeiro/PII/segurança/operacional) — matriz em `FLUXOS.md` §4.9

## Módulos principais

| Rota | Notas |
|------|-------|
| `/interno/dashboard` | KPIs operação · atividade recente com mesma política de `audit-access` |
| `/interno/agenda` | Walk-in em `AppointmentsView` |
| `/interno/cadastros` | CRUD + mapa em `?tab=operations` · abas em `next/dynamic` + `resolveCadastrosTab` |
| `/interno/estoque` | Produtos, lotes, movimentações, reversão (`stock-reverse.ts`) |
| `/interno/auditoria` | Timeline universal · export já redigido |
| `/interno/gestao` | Gestão clínica (MEDICAL/DENTAL) |
| `/interno/seguranca` | Demo reset, dual-store (ADMIN) |

## UI

- `useLabels()` em toda tela nova
- Breadcrumbs Cliente 360°: `buildPatientBreadcrumbs`
- E2E: `getByRole('navigation', { name: 'Navegação por abas' })`

Docs: `docs/produto/FLUXOS.md` · `docs/produto/DOCUMENTOS_CLINICOS.md` · CRUD: `src/lib/crud-operations-map.ts`
