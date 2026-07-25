# Guia rápido — Alana (CEDIG Cruzeiro)

Folha imprimível.  
Apresentador: [`TREINAMENTO.md`](TREINAMENTO.md) · exercícios: [`TREINAMENTO_ROTEIRO_PRATICO.md`](TREINAMENTO_ROTEIRO_PRATICO.md).

**Sistema:** ServiceOS **v2.6.0** · Gestão clínica.

---

## Acesso

| Item | Valor |
|------|--------|
| Site | https://sistema-bibi.netlify.app/?tenant=cedig |
| Ou | Login → clínica **`cedig`** → portal **Interno** |
| Login | `alana@cedig.demo` |
| Senha | `bibi123` |
| Tela | **Gestão clínica** |

Tour azul? → **pular** → Gestão clínica.

---

## As 3 abas

1. **Lançamentos** — 1 paciente = 1 linha (você não faz conta)  
2. **Despesas** — o que saiu de caixa  
3. **Indicadores** — o dono usa para decidir (+ pode **exportar Excel**)

---

## Como lançar um exame

1. Paciente (lista ou nome)  
2. Médico  
3. Tabela (Particular / CentralMed / Bem Saúde / Dr Saúde)  
4. Exame  
5. Biópsias / pólipo / clips — se houver  
6. Conferir **valor sugerido**  
7. Forma de pagamento  
8. Registrar → conferir **Ponte SYNCED**

### Exemplos de treino

| Paciente | Médico | Tabela | Extras | Valor |
|----------|--------|--------|--------|-------|
| Maria Teste Homolog | Bruno Dias | Particular | Endo + 1 biópsia | **R$ 900** |
| José CentralMed | Luiza Lage | CentralMed | Colonoscopia | **R$ 1.250** |
| Ana Polipectomia | Alexandre Marçal | Particular | Colo + pólipo int. + clip | **R$ 3.200** |
| Pedro Respiratório | (qualquer) | Bem Saúde | Teste respiratório | **R$ 450** |

---

## Despesas

Categoria → descrição → valor → **Registrar despesa**.

---

## Indicadores (dono)

Receita · despesas · lucro · ticket · exames por tipo · produção por médico · frascos.  
**Exportar** o mês se precisar do Excel.

---

## Atalho na agenda (opcional)

Agenda → **Lançar na gestão** → formulário já vem preenchido.

---

## Preços que o sistema já sabe

| Exame | Particular | CentralMed |
|-------|------------|------------|
| Endoscopia | R$ 750 | R$ 650 |
| Colonoscopia | R$ 1.450 | R$ 1.250 |
| Endo + Colo | R$ 2.000 | R$ 1.900 |

Teste respiratório: Particular **500** · Bem/Dr Saúde **450** · CentralMed **400**.  
Biópsia **R$ 150**/frasco · clip Particular **900** · pólipo intermediário Particular **850**.

---

## Médicos no select

Alexandre Marçal · Luiza Lage · Bruno Dias · Luiza Zeraik · Fernanda Auto

---

## Dicas

- Confira o **mês** no topo.  
- Valor estranho → revise tabela/exame/extras.  
- Não use “restaurar demo” em operação.  
- App no celular (v3.0) é outra linha — hoje o foco é esta tela.
