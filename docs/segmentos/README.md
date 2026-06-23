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

1. Landing: `/?niche=VET` (ou outro)
2. Login interno: `/interno/login` → selecione o tenant do segmento
3. Confirme badge **ServiceOS v2.0** + nicho no header
4. Nav com vocabulário do segmento (ex.: Tutores, não Beneficiários)

Senha: **`bibi123`**
