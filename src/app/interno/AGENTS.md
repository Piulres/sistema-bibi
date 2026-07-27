# Portal interno — contexto para agentes

**Layout:** `layout.tsx` · **Nav:** `InternoNav` (14 abas + gestão clínica MEDICAL/DENTAL)

## Padrão de página

Só `PageHeader` + view — shell em `layout.tsx` (não repetir `PortalShell`/`InternoNav`).

## RBAC

- Perfis: `ADMIN`, `FATURAMENTO`, `RECEPCAO`, `READONLY` (`User.internoProfile`)
- **Leitura:** `requireInternoModule(module)` — GET/HEAD nas APIs; `requireInternoPage` nas páginas
- **Escrita (Fase 5):** `requireInternoModuleWrite(module)` — POST/PATCH/PUT/DELETE; bloqueia `READONLY` via `canInternoWrite()`
- **Admin-only:** `requireInternoAdmin()` — demo reset, dual-store, usuários sensíveis
- Nav filtrada: `interno-permissions.ts` · `interno-guard.ts`
- Matriz completa: `docs/produto/FLUXOS.md` §9
- Testes: `tests/security/rbac-gaps.test.ts` (inventário estático) · `tests/api/interno-write-guards.test.ts` (READONLY não muta)

## Módulos principais

| Rota | Notas |
|------|-------|
| `/interno/dashboard` | KPIs operação |
| `/interno/agenda` | Walk-in em `AppointmentsView` |
| `/interno/cadastros` | CRUD + mapa em `?tab=operations` |
| `/interno/gestao` | Gestão clínica (MEDICAL/DENTAL) |
| `/interno/seguranca` | Demo reset, dual-store (ADMIN) |
| `/interno/assistente` | Config assistente — regras, flag IA (ADMIN) |

## UI

- `useLabels()` em toda tela nova
- Breadcrumbs Cliente 360°: `buildPatientBreadcrumbs`
- E2E: `getByRole('navigation', { name: 'Navegação por abas' })`

Docs: `docs/produto/FLUXOS.md` · CRUD: `src/lib/crud-operations-map.ts`
