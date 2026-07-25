# Treinamento CEDIG — roteiro prático (Alana)

Exercícios **hands-on** para a secretária. Use com o apresentador ([`TREINAMENTO.md`](TREINAMENTO.md)).  
Folha resumida: [`GUIA_RAPIDO_ALANA.md`](GUIA_RAPIDO_ALANA.md).

**Produto:** Sistema Bibi - ServiceOS **v2.6.0** · tela **Gestão clínica**.  
(Trilha **v3.0** mobile/PWA não entra neste exercício.)

---

## Antes de começar

| Item | Valor |
|------|--------|
| Site | https://sistema-bibi.netlify.app/?tenant=cedig |
| Alternativa | Login → clínica `cedig` → portal Interno |
| Seu login | `alana@cedig.demo` |
| Senha | `bibi123` |
| Onde trabalhar | Menu **Gestão clínica** |

1. Entre com seu e-mail e senha.  
2. Se aparecer tour, **pule**.  
3. Abra **Gestão clínica**.  
4. Confira o **mês atual** no filtro.

Regra: **você não faz conta**. Escolha nos menus e confira o valor sugerido.  
Depois de salvar, a coluna **Ponte** deve mostrar **SYNCED** (o exame entrou no fluxo do sistema).

---

## Exercício A — Quatro lançamentos

Aba **1. Lançamentos**.

### Caso C1 — Endoscopia particular + biópsia

| Campo | Valor |
|-------|-------|
| Paciente | `Maria Teste Homolog` |
| Médico | Bruno Dias |
| Tabela | Particular |
| Exame | Endoscopia Digestiva Alta |
| Biópsias | `1` |
| Pagamento | PIX |

**Gabarito: R$ 900** (750 + 150)

- [ ] Valor bateu  
- [ ] Linha na lista  
- [ ] Ponte **SYNCED**  

---

### Caso C2 — Colonoscopia CentralMed

| Campo | Valor |
|-------|-------|
| Paciente | `José CentralMed` |
| Médico | Luiza Lage |
| Tabela | CentralMed |
| Exame | Colonoscopia |

**Gabarito: R$ 1.250**

- [ ] Valor bateu · linha · Ponte SYNCED  

---

### Caso C3 — Colo + pólipo + clip

| Campo | Valor |
|-------|-------|
| Paciente | `Ana Polipectomia` |
| Médico | Alexandre Marçal |
| Tabela | Particular |
| Exame | Colonoscopia |
| Polipectomia | Intermediária × `1` |
| Clips | `1` |

**Gabarito: R$ 3.200** (1.450 + 850 + 900)

- [ ] Valor bateu · linha · Ponte SYNCED  

---

### Caso C4 — Teste respiratório Bem Saúde

| Campo | Valor |
|-------|-------|
| Paciente | `Pedro Respiratório` |
| Médico | qualquer |
| Tabela | Bem Saúde |
| Exame | Teste respiratório |

**Gabarito: R$ 450**

- [ ] Valor bateu · linha · Ponte SYNCED  

---

## Exercício B — Duas despesas

Aba **2. Despesas**.

| ID | Categoria | Descrição | Valor |
|----|-----------|-----------|-------|
| D1 | Laboratório de biópsias | `Lab biópsias — treino` | `300` |
| D2 | Pagamento de equipe… | `Pagamento equipe — treino` | `500` |

- [ ] Os dois na lista  

---

## Exercício C — Indicadores (+ Excel)

Aba **3. Indicadores**.

Se o mês **estava zerado**:

| Indicador | Gabarito |
|-----------|----------|
| Receita | **R$ 5.800** |
| Despesas | **R$ 800** |
| Lucro operacional | **R$ 5.000** |
| Exames | **4** |
| Frascos (lab) | **≥ 1** |

- [ ] Mostrei receita / despesas / lucro ao dono  
- [ ] Mostrei produção por médico  
- [ ] (Opcional) Exportei o mês em **Excel**  

---

## Exercício D — Agenda → gestão (opcional, +3 min)

1. Abrir **Agenda** (Exames).  
2. Em um item, usar **Lançar na gestão**.  
3. Conferir que o formulário da Gestão já veio preenchido.  
4. Completar e salvar (ou cancelar se for só demonstração).

- [ ] Atalho encontrado  

---

## Gabarito compacto

| ID | Esperado |
|----|----------|
| C1 | R$ 900 |
| C2 | R$ 1.250 |
| C3 | R$ 3.200 |
| C4 | R$ 450 |
| D1+D2 | R$ 300 + R$ 500 |
| Receita (mês zerado) | R$ 5.800 |
| Lucro (mês zerado) | R$ 5.000 |
| Ponte | SYNCED |

Conferido vs `cedig-pricing.ts` · pontes: [`FASE_2.md`](FASE_2.md).

---

## Se algo der errado

1. Valor errado → revisar tabela/exame/extras.  
2. Ponte não SYNCED → avisar o apresentador (anotar horário + print).  
3. Tour de novo → pular e voltar em Gestão clínica.  
4. Médico faltando → avisar (equipe deveria estar cadastrada).

---

## Depois do treino (1 semana)

- Lance os exames reais do dia aqui.  
- Lance despesas quando saírem.  
- Dono olha **Indicadores** 1×/semana (e pode exportar Excel).  
- Anote o que faltou para a revisão.
