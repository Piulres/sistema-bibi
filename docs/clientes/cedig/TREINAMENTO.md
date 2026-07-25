# Treinamento CEDIG Cruzeiro — roteiro do apresentador

Sessão de **30–45 min** (fala + cliques) com a secretária **Alana** e o dono.  
Quem segue este arquivo consegue apresentar **sem improvisar**.

| Material | Uso |
|----------|-----|
| **Este arquivo** | Roteiro falado + clicado (você apresenta) |
| [`TREINAMENTO_ROTEIRO_PRATICO.md`](TREINAMENTO_ROTEIRO_PRATICO.md) | Exercícios hands-on da Alana + gabarito |
| [`TREINAMENTO_SLIDES.md`](TREINAMENTO_SLIDES.md) | Outline de slides (1 ideia por slide) |
| [`GUIA_RAPIDO_ALANA.md`](GUIA_RAPIDO_ALANA.md) | Folha imprimível da secretária |
| [`FASE_2.md`](FASE_2.md) | Mapa técnico das pontes (PPU / agenda / export) |
| [`GO_LIVE_CHECKLIST.md`](GO_LIVE_CHECKLIST.md) | Checklist pré-apresentação |

**Produto:** Sistema Bibi - ServiceOS.  
**Produção (treino):** **v2.6.0** — gestão clínica + pontes fase 2+F.  
**Linha paralela:** **v3.0** = PWA/mobile em desenvolvimento ([`V3_0.md`](../../versoes/V3_0.md)) — **não** é o foco desta sessão com a CEDIG.

**Foco da demo:** Alana opera **Gestão clínica**; o sistema já amarra lançamento → agenda/PPU (coluna Ponte **SYNCED**).  
Homologação humana in loco ainda valida o dia a dia dos 4 portais — não vender como “produção plena” sem essa rodada.

---

## Versões (contexto rápido)

| Ambiente | Versão | Nota |
|----------|--------|------|
| Produção Netlify | **2.6.0** | Ponte gestão→PPU · export Excel · login tenant/portal · modo operação |
| Pacote anterior | 2.4.0 | Só gestão clínica (ledger) |
| WIP | **3.0.0** | App shell / PWA — isolado; não muda o roteiro CEDIG |

Fonte: [`RELEASES.md`](../../versoes/RELEASES.md).

---

## Antes da reunião — checklist de preparação

- [ ] Abrir https://sistema-bibi.netlify.app/?tenant=cedig (ou login e digitar clínica `cedig`)
- [ ] Confirmar title/versão **v2.6.0** e branding CEDIG
- [ ] Login `alana@cedig.demo` / `bibi123` funciona
- [ ] Menu **Gestão clínica** → `/interno/gestao` com abas Lançamentos · Despesas · Indicadores
- [ ] Médicos no select (5) · exames · tabelas Particular / CentralMed / Bem Saúde / Dr Saúde
- [ ] Após um lançamento de teste: coluna **Ponte** = **SYNCED** (ou planejar mostrar no vivo)
- [ ] Botão **Exportar** (Excel do mês) visível
- [ ] Agenda tem **Lançar na gestão** (opcional no roteiro curto)
- [ ] Imprimir [`GUIA_RAPIDO_ALANA.md`](GUIA_RAPIDO_ALANA.md) + [`TREINAMENTO_ROTEIRO_PRATICO.md`](TREINAMENTO_ROTEIRO_PRATICO.md)
- [ ] Smoke rápido: [`GO_LIVE_CHECKLIST.md`](GO_LIVE_CHECKLIST.md)
- [ ] **Não** mudar modo demo/operação sem pedido · **não** fazer deploy

Se faltar tenant na operação (ADMIN): `POST /api/interno/operation/provision-cedig` + `{ "confirm": "CEDIG" }` — [`OPERACAO_DADOS.md`](../../plataforma/OPERACAO_DADOS.md).

---

## Ambiente

| Item | Valor |
|------|--------|
| URL | https://sistema-bibi.netlify.app/?tenant=cedig |
| Login (atalho) | Qualquer `/…/login` → clínica **`cedig`** → portal **Interno** |
| Conta Alana | `alana@cedig.demo` / `bibi123` |
| Tela-chave | `/interno/gestao` |
| ADMIN | `operacao@cedig.demo` ou `faturamento@bibi.health` / `bibi123` |

**Fallback local** (503/cota):

```bash
npm run db:push && npm run db:seed
npm run dev
# http://localhost:3000/?tenant=cedig
```

Na fala ao cliente: **exame**, **médico**, **particular/convênio**. Evite jargão (tenant, PPU, bridge) — diga “o sistema já registra a cobrança” / “aparece para o médico”.

---

## Agenda da sessão

| Bloco | Tempo | Foco |
|-------|-------|------|
| **0** Abertura | 3 min | Planilha → 3 abas (+ pontes já no ar) |
| **1** Entrada | 5 min | Login Alana + Gestão clínica + equipe |
| **2** Lançamentos | 12–15 min | C1–C4 · valor sugerido · Ponte SYNCED |
| **3** Despesas | 5 min | Lab R$ 300 · Pessoal R$ 500 |
| **4** Indicadores (+ opcional Excel) | 5–7 min | KPIs · export · (opcional) agenda |
| **5** Encerramento | 5 min | O que já está · 1 semana real · v3.0 só se perguntarem |

---

## Bloco 0 — Abertura (3 min)

### Falar

> “Vocês pediram sair da planilha: a Alana lança um paciente por linha, registra despesas, e o senhor vê lucro e produção sem montar conta.  
> São três abas: **Lançamentos**, **Despesas** e **Indicadores**.  
> Na versão de hoje, quando ela lança o exame, o sistema **já amarra** isso na agenda e na cobrança — não fica só num caderninho à parte.”

### Clicar

Home com CEDIG no projetor (opcional).

---

## Bloco 1 — Entrada no sistema (5 min)

### Falar

> “Entro pela clínica CEDIG. A Alana usa o e-mail dela.  
> Em **Gestão clínica** estão os médicos e as tabelas de preço de vocês. Ela só escolhe no menu.”

### Clicar

1. Abrir produção com `?tenant=cedig` **ou** login → digitar clínica `cedig` → **Aplicar** → portal **Interno**.
2. `/interno/login` · `alana@cedig.demo` / `bibi123`.
3. Pular tour se aparecer.
4. **Gestão clínica** → três abas.
5. Abrir select **Médico**: Alexandre Marçal · Luiza Lage · Bruno Dias · Luiza Zeraik · Fernanda Auto.

---

## Bloco 2 — Lançamentos ao vivo (12–15 min)

### Falar

> “Cada paciente é uma linha. Escolhe médico, tabela, exame e extras — biópsia, pólipo, clip.  
> O valor **aparece sozinho**.  
> Depois de registrar, vejam a coluna da **ponte**: significa que o exame já entrou no fluxo do sistema (agenda/cobrança), não só na listinha da secretária.”

### Clicar

Aba **1. Lançamentos**. Alana digita; você confere o valor **antes** de salvar.  
Detalhe: [`TREINAMENTO_ROTEIRO_PRATICO.md`](TREINAMENTO_ROTEIRO_PRATICO.md).

| Caso | Paciente | Médico | Tabela | Exame | Extras | Valor |
|------|----------|--------|--------|-------|--------|-------|
| **C1** | Maria Teste Homolog | Bruno Dias | Particular | Endoscopia | 1 biópsia | **R$ 900** |
| **C2** | José CentralMed | Luiza Lage | CentralMed | Colonoscopia | — | **R$ 1.250** |
| **C3** | Ana Polipectomia | Alexandre Marçal | Particular | Colonoscopia | poli intermediária + 1 clip | **R$ 3.200** |
| **C4** | Pedro Respiratório | (qualquer) | Bem Saúde | Teste respiratório | — | **R$ 450** |

Após cada registro (ou no C1): apontar **Ponte = SYNCED**.

> “A secretária **não calcula** — escolhe nos menus; o sistema sugere o valor.”

---

## Bloco 3 — Despesas (5 min)

### Falar

> “Segunda aba: o que saiu de caixa — laboratório, anestesista, equipe, insumos… Dois lançamentos e o mês já fecha nos indicadores.”

### Clicar

1. Aba **2. Despesas**
2. Laboratório · `Lab biópsias — treino` · `300`
3. Pagamento de equipe · `Pagamento equipe — treino` · `500`

---

## Bloco 4 — Indicadores (5–7 min)

### Falar

> “Terceira aba: receita, despesas, lucro; exames por tipo; produção por médico; frascos; ticket médio.  
> Se quiserem o hábito da planilha, tem **exportar o mês em Excel** — sem voltar a digitar tudo à mão.”

### Clicar

1. Aba **3. Indicadores** — receita · despesas · lucro · produção por médico · frascos · ticket · lucro por exame  
2. (Opcional) **Exportar** Excel do mês  
3. (Opcional, +2 min) Agenda → **Lançar na gestão** (mostra o atalho inverso)

**Gabarito se o mês estava zerado:** receita **R$ 5.800** · despesas **R$ 800** · lucro **R$ 5.000** · 4 exames.

---

## Bloco 5 — Encerramento (5 min)

### Falar

> “O que já está no ar: lançamentos, despesas, indicadores, preços da CEDIG, e a amarração com cobrança/agenda.  
> O que pedimos agora: a Alana usa **uma semana de verdade** e a gente revisa juntos.  
> App no celular (instalável) é linha à parte — quando fizer sentido, mostramos; hoje o foco é a operação da secretária.”

### Combinar

| Já no piloto (v2.6) | Ainda com cuidado |
|---------------------|-------------------|
| Gestão clínica (3 abas) | Homologação humana dos 4 portais no dia a dia |
| Ponte lançamento → cobrança/agenda | Contas de beneficiário para todo paciente só-nome |
| Export Excel · agenda → gestão | Logo final / hábitos da clínica |
| Login com clínica + portal | App PWA v3.0 (WIP) |

**Suporte:** data/hora · o que tentou · print · enviar ao contato Tecnol/Bibi.

---

## FAQ curto

| Pergunta | Resposta |
|----------|----------|
| Senha? | `bibi123` · `alana@cedig.demo` |
| Valor diferente? | Conferir tabela/exame/extras; anotar se persistir |
| Preciso calcular? | Não |
| O que é “Ponte SYNCED”? | O lançamento já gerou o registro no fluxo (agenda/cobrança) |
| Onde o médico vê? | Portal do prestador (após o lançamento sincronizado) — mostrar só se houver tempo |
| Excel? | Botão de exportar o mês na Gestão clínica |
| Esqueci logout? | Sair no menu da conta |
| E o app no celular? | Trilha v3.0 em desenvolvimento — não é o piloto desta reunião |

---

## Depois da reunião — checklist pós-sessão

- [ ] C1–C4 e D1–D2 ok? Ponte SYNCED vista?
- [ ] Indicadores (+ Excel se mostrado) ok?
- [ ] Feedback Alana / dono anotado
- [ ] “1 semana real” combinada?
- [ ] Registrar em [`HISTORICO_VALIDACAO.md`](HISTORICO_VALIDACAO.md)

---

## Referências

- Cliente: [`README.md`](README.md) · pontes: [`FASE_2.md`](FASE_2.md) · go-live: [`GO_LIVE_CHECKLIST.md`](GO_LIVE_CHECKLIST.md)  
- Releases: [`RELEASES.md`](../../versoes/RELEASES.md) · v2.6: [`V2_6.md`](../../versoes/V2_6.md) · v3.0 WIP: [`V3_0.md`](../../versoes/V3_0.md)  
- UI: `ClinicFinanceView.tsx` · bridge: `src/lib/clinic-finance/bridge.ts` · preços: `cedig-pricing.ts`
