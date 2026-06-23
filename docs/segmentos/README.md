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

| Entrada | Exemplo | Resolve |
|---------|---------|---------|
| Slug do tenant | `/?tenant=petcare` | PetCare · VET |
| Nicho (fallback) | `/?niche=LEGAL` | Primeiro tenant LEGAL |
| Domínio customizado | DNS verificado no branding | Tenant do domínio |
| Cookie `bibi_segment` | Após landing/login | Persiste entre páginas |

**Prioridade de resolução:** `?tenant=` → cookie → domínio → `?niche=` → default MEDICAL.

Implementação: `src/lib/segment/resolve.ts`. Cookie assinado HMAC (`SESSION_SECRET`, 7 dias): `src/lib/segment/cookie.ts`.

### Persistência do cookie (client)

No Next.js 16, cookies httpOnly só podem ser gravados em Route Handlers. A landing monta `SegmentCookiePersist`, que chama:

```
POST /api/segment/persist
Body: { "tenant": "petcare" }  // ou { "niche": "VET" }
```

Isso garante que mobile e navegação SPA mantenham o segmento entre landing → login → portais.

### Login cross-tenant

`POST /api/auth/login` valida `user.tenantId` contra o segmento ativo. Conta de outro tenant → **403** com URL do portal correto (`?tenant=…`). Ver `src/lib/segment/auth.ts` e [`FLUXOS.md`](../produto/FLUXOS.md) §2.1.

### Contas demo por slug

| Slug | Nicho | Login interno |
|------|-------|---------------|
| `horizonte` | MEDICAL | `faturamento@bibi.health` |
| `petcare` | VET | `operacao@petcare.demo` |
| `smile` | DENTAL | `operacao@smile.demo` |
| `lex` | LEGAL | `operacao@lex.demo` |
| `zen` | SPA | `operacao@zen.demo` |
| `eduprime` | EDUCATION | `operacao@eduprime.demo` |

Fonte canônica de slugs: `src/lib/niche/demo-accounts.ts` (`SEGMENT_TENANTS`).

Senha: **`bibi123`**
