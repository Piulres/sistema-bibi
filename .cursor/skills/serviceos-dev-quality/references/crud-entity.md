# CRUD — nova entidade

## Antes de codar

1. `src/lib/crud-operations-map.ts` — adicionar entrada
2. `docs/plataforma/TESTES.md` §Matriz CRUD

## Obrigatório no PR

| Item | Arquivo |
|------|---------|
| Registry de cobertura | `tests/lib/crud-coverage-registry.ts` |
| Teste API matriz | `tests/api/system-crud-matrix.test.ts` |
| Auth interno | `requireInternoModule` (GET) / `requireInternoModuleWrite` (POST/PATCH/PUT/DELETE) — Fase 5 generalizada |

## UI

- Mapa visível: `/interno/cadastros?tab=operations`
- Labels: `useLabels()` — nunca strings fixas de entidade
