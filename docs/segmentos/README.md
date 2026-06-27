# Segmentos ServiceOS v2.0

Cada pasta deste diretório documenta um **vertical** suportado pela plataforma: glossário de labels, contas demo, pesquisa de mercado, **playbook comercial** e links para código.

> **Features comuns a todos os nichos:** [`../comercial/MODULOS_COMUNS.md`](../comercial/MODULOS_COMUNS.md)  
> **Estratégia de captação por segmento:** [`../comercial/ESTRATEGIA_SEGMENTOS.md`](../comercial/ESTRATEGIA_SEGMENTOS.md)

| Segmento | `niche` | Pasta | Comercial | Pesquisa |
|----------|---------|-------|-----------|----------|
| Saúde | `MEDICAL` | [`medical/`](medical/) | [`COMERCIAL.md`](medical/COMERCIAL.md) | [`pesquisa-expansao-2026.md`](medical/pesquisa-expansao-2026.md) |
| Veterinária | `VET` | [`vet/`](vet/) | [`COMERCIAL.md`](vet/COMERCIAL.md) | [`pesquisa.md`](vet/pesquisa.md) |
| Odontologia | `DENTAL` | [`dental/`](dental/) | [`COMERCIAL.md`](dental/COMERCIAL.md) | [`pesquisa.md`](dental/pesquisa.md) |
| Jurídico | `LEGAL` | [`legal/`](legal/) | [`COMERCIAL.md`](legal/COMERCIAL.md) | [`pesquisa.md`](legal/pesquisa.md) |
| Bem-estar | `SPA` | [`spa/`](spa/) | [`COMERCIAL.md`](spa/COMERCIAL.md) | [`pesquisa.md`](spa/pesquisa.md) |
| Educação | `EDUCATION` | [`education/`](education/) | [`COMERCIAL.md`](education/COMERCIAL.md) | [`pesquisa.md`](education/pesquisa.md) |

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

Senha: **`bibi123`**
