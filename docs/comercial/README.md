# Comercial e captação — ServiceOS v2.0

Documentação de **vendas, marketing e posicionamento por segmento**. Complementa [`pesquisa/`](../pesquisa/README.md) (dados de mercado) e [`produto/`](../produto/FLUXOS.md) (fluxos técnicos).

> **Regra:** cada vertical tem técnicas de captação distintas. O motor Pay Per Use é comum; a **dor, o ICP e o argumento financeiro** mudam por nicho.

---

## Por onde começar

| Perfil | Documento |
|--------|-----------|
| Visão geral do produto | [`MODULOS_COMUNS.md`](MODULOS_COMUNS.md) |
| Benchmarks por nicho | [`BENCHMARKS_POR_NICHO.md`](BENCHMARKS_POR_NICHO.md) |
| Plano e mudanças na homepage | [`PLANO_HOMEPAGE.md`](PLANO_HOMEPAGE.md) |
| Técnicas por vertical | [`ESTRATEGIA_SEGMENTOS.md`](ESTRATEGIA_SEGMENTOS.md) |
| Segmento específico | [`../segmentos/README.md`](../segmentos/README.md) → `COMERCIAL.md` |
| ROI saúde (referência) | [`../plataforma/ROI_REFERENCIA.md`](../plataforma/ROI_REFERENCIA.md) |
| Benchmark técnico | [`../plataforma/BENCHMARK.md`](../plataforma/BENCHMARK.md) |

---

## Estrutura

```
docs/comercial/
├── README.md                 ← você está aqui
├── MODULOS_COMUNS.md         ← features compartilhadas (4 portais + plataforma)
├── BENCHMARKS_POR_NICHO.md   ← concorrentes, features, prós/contras por vertical
├── PLANO_HOMEPAGE.md         ← plano e registro de mudanças na home
└── ESTRATEGIA_SEGMENTOS.md   ← matriz de captação e links por nicho

docs/segmentos/{niche}/
├── README.md                 ← demo, glossário, código
├── pesquisa.md               ← TAM/SAM, concorrentes, preços
└── COMERCIAL.md              ← ICP, dor, técnicas, features individuais
```

---

## Política de veracidade (comercial)

| Tag | Uso |
|-----|-----|
| **FATO** | Implementado no código ou demonstrável no seed |
| **INFERÊNCIA** | Projeção de ROI, TAM, script de vendas — validar em piloto |

Números de economia (ex.: ~87%) são **cenários modelados**, não promessa contratual. Ver [`../pesquisa/README.md`](../pesquisa/README.md#política-de-veracidade).

---

## Manutenção

Ao fechar pacote comercial ou novo módulo por nicho:

1. Atualizar [`MODULOS_COMUNS.md`](MODULOS_COMUNS.md) se o core mudar.
2. Atualizar `COMERCIAL.md` do segmento afetado.
3. Revisar copy da landing em `src/lib/niche/landing-content.ts` e `defaults.ts`.
4. Rodar `npm run docs:verify`.
