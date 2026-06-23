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

**Resolver canônico:** `src/lib/segment/resolve.ts` — `resolveSegmentContext()` e variantes para headers/login.

### Prioridade de resolução

```
?tenant=slug  →  cookie bibi_segment  →  domínio customizado  →  ?niche=  →  default MEDICAL
```

| Entrada | Exemplo | Resolve |
|---------|---------|---------|
| Slug do tenant | `/?tenant=petcare` | PetCare · VET |
| Cookie `bibi_segment` | Após landing/login | Persiste entre páginas (HMAC, 7 dias, `SESSION_SECRET`) |
| Domínio customizado | DNS verificado no branding | Tenant do domínio |
| Nicho (fallback) | `/?niche=LEGAL` | Primeiro tenant LEGAL cadastrado |
| Default | `/` sem parâmetros | Primeiro tenant `MEDICAL` (Horizonte) |

### Persistência do cookie (mobile / Next.js 16)

Cookies assinados só podem ser gravados em **Route Handlers**. O cliente chama:

```
POST /api/segment/persist  { "tenant": "petcare" }
```

Componente: `src/components/segment/SegmentCookiePersist.tsx` (landing e formulários de login).

Cookie: `src/lib/segment/cookie.ts` — assinatura HMAC-SHA256 com `SESSION_SECRET`, validade 7 dias.

### Guarda no login

`validateUserSegmentAccess()` (`src/lib/segment/auth.ts`) bloqueia contas de outro tenant com **403** — ex.: `faturamento@bibi.health` em `/?tenant=petcare`.

O login aceita `tenantSlug` no body; em sucesso persiste `bibi_segment` e retorna `segment` no JSON.

**Deprecado:** `src/lib/niche/resolve.ts` — wrapper legado da landing; use `src/lib/segment/resolve.ts`.

Senha: **`bibi123`**
