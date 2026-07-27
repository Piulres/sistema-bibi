# Portal interno — contexto para agentes

**Layout:** `layout.tsx` · **Nav:** `InternoNav` (14 abas + gestão clínica MEDICAL/DENTAL)

## Padrão de página

Só `PageHeader` + view — shell em `layout.tsx` (não repetir `PortalShell`/`InternoNav`).

## RBAC

- Perfis: `ADMIN`, `FATURAMENTO`, `RECEPCAO`, `READONLY` (`User.internoProfile`)
- **Leitura (GET):** `requireInternoModule(module)` — perfil precisa do módulo na matriz
- **Escrita (POST/PATCH/PUT/DELETE):** `requireInternoModuleWrite(module)` — bloqueia `READONLY` mesmo com módulo de leitura (Fase 5, v3.0.22)
- **Admin-only:** `requireInternoAdmin()` — segurança, dual-store, assistente config
- Nav filtrada: `interno-permissions.ts` · páginas: `interno-guard.ts`
- Testes: `tests/security/rbac-gaps.test.ts` (inventário) · `tests/api/interno-write-guards.test.ts` (READONLY → 403)

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
