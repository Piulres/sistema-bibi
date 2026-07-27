# CEDIG — Homologação (gestão clínica)

Checklist vivo dos casos de preço em `/interno/gestao`.  
Status geral: [`STATUS.md`](STATUS.md) · rotina: [`OPERACAO.md`](OPERACAO.md).

> Tours: pular o tour principal bloqueia micro-tours. Demo: `NEXT_PUBLIC_DISABLE_ONBOARDING_AUTO=true`.  
> `?tenant=cedig` usa store **operation**.

---

## Pré-condições

Produção atual: **v3.0.27** @ https://sistema-bibi.netlify.app · tenant `cedig` · modo **operação**.

```bash
npm run db:bootstrap:demo
echo operation > prisma/.data-store-mode
NEXT_PUBLIC_DISABLE_ONBOARDING_AUTO=true npm run dev
# opcional: ./scripts/cedig-mapear.sh
```

| Item | Valor |
|------|-------|
| Login | `alana@cedig.demo` / `bibi123` |
| Tela | `/interno/gestao` |

---

## Casos (C1–C4 + despesas)

| Caso | Paciente | Tabela / exame | Esperado |
|------|----------|----------------|----------|
| C1 | Maria Teste Homolog | Particular · Endoscopia + 1 biópsia | **R$ 900** |
| C2 | José CentralMed | CentralMed · Colonoscopia | **R$ 1.250** |
| C3 | Ana Polipectomia | Particular · Colo + polipectomia intermediária + 1 clip | **R$ 3.200** |
| C4 | Pedro Respiratório | Bem Saúde · Teste respiratório | **R$ 450** |
| D1 | — | Despesa Lab `300` | lista |
| D2 | — | Despesa Pessoal `500` | lista |

Médicos no select: Alexandre Marçal · Luiza Lage · Bruno Dias · Luiza Zeraik · Fernanda Autran.

### Treino Alana (15 min) — roteiro

1. Login `alana@cedig.demo` / `bibi123` → confirmar **modo operação** em `/interno/seguranca`
2. `/interno/gestao` → executar C1–C4 + D1–D2 (tabela acima)
3. Verificar KPIs, labels **Exame** e coluna **SYNCED**
4. `/login?tenant=cedig` com prestador de teste → fila no extrato
5. Beneficiário demo → **Exames** + fatura

> Marque os itens de aceite abaixo após sessão presencial. Atualize [`STATUS.md`](STATUS.md) na timeline.

### Aceite
- [ ] Valor sugerido sem cálculo manual  
- [ ] Menus médico/exame/tabela/polipectomia preenchidos  
- [ ] 4 lançamentos + 2 despesas no mês  
- [ ] KPIs coerentes · labels **Exame**  
- [ ] Ponte **SYNCED** nos lançamentos

### Último resultado
| Data | Ambiente | Resultado |
|------|----------|-----------|
| 2026-07-26 | operation.db local | ✅ C1–C4 SYNCED + 4 portais |
| 2026-07-25 | local | ✅ C1–C4 / D1–D2 |

Detalhe de preços institucionais: [`README.md`](README.md).
