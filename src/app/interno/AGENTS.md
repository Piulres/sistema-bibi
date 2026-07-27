# Portal interno — contexto para agentes

**Layout:** `layout.tsx` · **Nav:** `InternoNav` (14 abas + gestão clínica MEDICAL/DENTAL)

## Padrão de página

Só `PageHeader` + view — shell em `layout.tsx` (não repetir `PortalShell`/`InternoNav`).

## RBAC

- Perfis: `ADMIN`, `FATURAMENTO`, `RECEPCAO`, `READONLY` (`User.internoProfile`)
- **Leitura:** `requireInternoModule(module)` — matriz em `interno-permissions.ts`
- **Escrita:** `requireInternoModuleWrite(module)` — bloqueia `READONLY` (Fase 5, #354)
- **Admin-only:** `requireInternoAdmin()` — demo reset, dual-store, assistente settings
- Nav filtrada: `interno-permissions.ts` · `interno-guard.ts`

Padrão em Route Handlers internos: `GET` → `requireInternoModule`; `POST`/`PATCH`/`PUT`/`DELETE` → `requireInternoModuleWrite`. Testes: `tests/security/rbac-gaps.test.ts`.

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
