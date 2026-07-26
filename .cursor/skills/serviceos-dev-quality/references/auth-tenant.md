# Login, tenant e segmento

## Docs

- `docs/versoes/V2_5.md` — login tenant/portal
- `docs/segmentos/README.md` — demos por vertical

## Código

- `src/lib/auth/login-access.ts`
- `src/lib/segment/auth.ts` · `src/lib/segment/resolve.ts`
- Cookie: `bibi_segment` · query: `?tenant=petcare`

## Invariantes

- Colaborador deve pertencer ao `tenantId` do site (`?tenant=` ou domínio)
- `Tenant.niche` + `Tenant.slug` + `Tenant.labels`
- Nunca hardcodar portal/segmento em copy genérica
