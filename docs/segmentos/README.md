# Segmentos ServiceOS v2.0

Cada pasta deste diretório documenta um **vertical** suportado pela plataforma: glossário de labels, contas demo, pesquisa de mercado e links para código.

| Segmento | `niche` | Pasta | Pesquisa |
|----------|---------|-------|----------|
| Saúde | `MEDICAL` | [`medical/`](medical/) | [`pesquisa-expansao-2026.md`](medical/pesquisa-expansao-2026.md) |
| Veterinária | `VET` | [`vet/`](vet/) | [`pesquisa.md`](vet/pesquisa.md) |
| Odontologia | `DENTAL` | [`dental/`](dental/) | [`pesquisa.md`](dental/pesquisa.md) |
| Jurídico | `LEGAL` | [`legal/`](legal/) | [`pesquisa.md`](legal/pesquisa.md) |
| Bem-estar | `SPA` | [`spa/`](spa/) | [`pesquisa.md`](spa/pesquisa.md) |
| Educação | `EDUCATION` | [`education/`](education/) | [`pesquisa.md`](education/pesquisa.md) |

**Código canônico de labels:** [`src/constants/niches.ts`](../../src/constants/niches.ts)  
**Template para novo segmento:** [`../pesquisa/TEMPLATE_PESQUISA_NICHO.md`](../pesquisa/TEMPLATE_PESQUISA_NICHO.md)

## Como validar um segmento em demo

1. Landing: `/?tenant=petcare` (recomendado) ou `/?niche=VET`
2. Clique em um portal — o link leva `?tenant=petcare` no login
3. Entre com `operacao@petcare.demo` — contas de outro tenant são bloqueadas
4. Confirme badge **ServiceOS v2.0** + nicho no header e nav do segmento

## Roteamento por segmento

Prioridade em `resolveSegmentContext()` (`src/lib/segment/resolve.ts`):

1. `?tenant=slug` — tenant explícito na URL (recomendado em demo)
2. Cookie assinado `bibi_segment` — persistido entre landing → login
3. Domínio customizado — `resolveTenantIdFromHost()`
4. `?niche=VET` — primeiro tenant do nicho no seed
5. Default `MEDICAL`

| Entrada | Exemplo | Resolve |
|---------|---------|---------|
| Slug do tenant | `/?tenant=petcare` | PetCare · VET |
| Cookie `bibi_segment` | Após landing/login | Segmento persistido (HMAC, 7 dias) |
| Domínio customizado | DNS verificado no branding | Tenant do domínio |
| Nicho (fallback) | `/?niche=LEGAL` | Primeiro tenant LEGAL |

### Persistência do cookie (`bibi_segment`)

No Next.js 16, `cookies().set()` **não pode** ser chamado em Server Components — a landing e os logins quebravam com 500 ao tentar gravar o cookie no servidor da página.

Fluxo correto:

1. Cliente: `SegmentCookiePersist` lê `?tenant=` / `?niche=` da URL.
2. `POST /api/segment/persist` — Route Handler resolve o segmento e chama `persistSegmentCookie()`.
3. Login bem-sucedido também regrava o cookie via `persistSegmentCookie()` no handler de auth.

| Artefato | Caminho |
|----------|---------|
| API | `src/app/api/segment/persist/route.ts` |
| Componente client | `src/components/segment/SegmentCookiePersist.tsx` |
| Cookie HMAC | `src/lib/segment/cookie.ts` (`SESSION_SECRET`, `httpOnly`) |
| Validação no login | `src/lib/segment/auth.ts` — bloqueia conta de outro tenant |

Montado em: landing (`src/app/page.tsx`) e `LoginForm` (todos os portais).

**Pitfall:** se o cookie não persistir, confira que `SegmentCookiePersist` está dentro de `<Suspense>` (usa `useSearchParams`) e que `SESSION_SECRET` está definido.

Senha: **`bibi123`**
