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

### Persistência do cookie (mobile)

Em navegadores mobile, cookies `Set-Cookie` em Server Components podem falhar. O componente `SegmentCookiePersist` (landing e páginas públicas) chama **`POST /api/segment/persist`** com `?tenant=` / `?niche=` da URL; o Route Handler grava o cookie assinado via `persistSegmentCookie()`.

- Código: `src/components/segment/SegmentCookiePersist.tsx` · `src/app/api/segment/persist/route.ts`
- Login/MFA também persistem o segmento após autenticação (`src/app/api/auth/login/route.ts`)

Senha: **`bibi123`**
