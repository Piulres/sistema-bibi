# Treinamento CEDIG — outline de slides

1 slide = 1 ideia.  
Usar com [`TREINAMENTO.md`](TREINAMENTO.md). Produção de referência: **ServiceOS v2.6.0**.

**Sugestão:** 12 slides · projetar **e** demonstrar `/interno/gestao`.

---

## Slide 1 — Título

**CEDIG Cruzeiro × Sistema Bibi - ServiceOS**  
Piloto: Gestão clínica · v2.6

- Sessão prática · 30–45 min  
- Alana opera · dono decide com números  

---

## Slide 2 — O problema

**A planilha segura o mês — e o risco**

- Soma na mão → erro fácil  
- Difícil ver lucro na hora  
- Produção por médico fica para “depois”  

---

## Slide 3 — A promessa

**Três abas. Sem calculadora.**

1. Lançamentos  
2. Despesas  
3. Indicadores  

- Valor sugerido pelo sistema  
- Lançamento já amarra cobrança/agenda (v2.6)  

---

## Slide 4 — Quem usa o quê

**Papéis no dia a dia**

- **Alana** → lança exames e despesas  
- **Dono** → olha indicadores (+ Excel se quiser)  
- Médicos e preços → já cadastrados  

---

## Slide 5 — Entrar na CEDIG

**Abrir o sistema da clínica**

- Clínica `cedig` no login (ou link direto)  
- Conta da Alana  
- Menu **Gestão clínica**  

*(corta para a tela ao vivo)*

---

## Slide 6 — Equipe e tabelas

**Já está pronto**

- Cinco médicos no menu  
- Particular · CentralMed · Bem Saúde · Dr Saúde  
- Endoscopia · colonoscopia · teste respiratório…  

---

## Slide 7 — Lançamentos

**Escolher menus → valor aparece**

- Paciente · médico · tabela · exame  
- Biópsia / pólipo / clip se houver  
- Coluna **Ponte SYNCED** = entrou no fluxo  

---

## Slide 8 — Quatro casos (prática)

| Caso | Esperado |
|------|----------|
| Endoscopia + 1 biópsia | R$ 900 |
| Colonoscopia CentralMed | R$ 1.250 |
| Colo + pólipo + clip | R$ 3.200 |
| Teste respiratório Bem Saúde | R$ 450 |

→ [`TREINAMENTO_ROTEIRO_PRATICO.md`](TREINAMENTO_ROTEIRO_PRATICO.md)

---

## Slide 9 — Despesas

**O que saiu de caixa**

- Lab · anestesista · equipe · insumos…  
- Exemplo: lab R$ 300 · equipe R$ 500  

---

## Slide 10 — Indicadores + Excel

**Números sozinhos**

- Receita · despesas · lucro  
- Produção por médico · frascos · ticket  
- Exportar o mês em Excel (sem voltar à planilha manual)  

---

## Slide 11 — O que já está / o que cuidamos

| Já no ar (v2.6) | Com cuidado |
|-----------------|-------------|
| Gestão + pontes | Homologação humana in loco |
| Export · agenda→gestão | Hábitos da clínica / logo |
| Login clínica + portal | App celular (v3.0 WIP) |

---

## Slide 12 — Próximos passos

**Uma semana real**

- Alana lança o dia a dia  
- Dono revisa indicadores 1×/semana  
- Revisão curta do que faltou  
- Dúvida → anotar e avisar  

---

## Notas

- Preferir **tela do sistema** nos blocos 1–4.  
- Sem jargão técnico nos slides.  
- Branding CEDIG do produto; não inventar tema novo.  
- v3.0 (PWA) só se o cliente perguntar — ver [`V3_0.md`](../../versoes/V3_0.md).
