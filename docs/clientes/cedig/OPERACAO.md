# CEDIG — Operação (playbook)

Rotina diária do piloto. Status e timeline: [`STATUS.md`](STATUS.md).  
Homologação de preços: [`HOMOLOGACAO.md`](HOMOLOGACAO.md). Cliente/preços: [`README.md`](README.md).

> **Tenant:** `/?tenant=cedig` · **Store:** operação · **Senha:** `bibi123`  
> **Produção:** ServiceOS **v3.0.5** · https://sistema-bibi.netlify.app

---

## Contas

| Papel | Conta | Portal | Ações |
|-------|-------|--------|-------|
| Secretária | `alana@cedig.demo` | `/interno/login` | Agenda, walk-in, lançamentos, cadastros leves |
| ADMIN | `operacao@cedig.demo` | `/interno/login` | Usuários, branding, despesas, indicadores |
| Médico | `bruno.dias@cedig.demo` | `/login` | Fila, atendimento, extrato |
| Médica (cadastro operação) | `gabriela@cedig.demo` | `/login` | Anestesia · consulta walk-in Renan Emigdio (anamnese unificada) |
| PJ CentralMed | `rh@centralmed.demo` | `/pj/login` | Consumo PPU, faturas |
| Beneficiário | `maria.cedig@email.com` | `/beneficiario/login` | Exames, agenda, faturas |

---

## Playbook diário

### Manhã — Alana
1. `/?tenant=cedig` → `/interno/login`
2. **Agenda** — exames do dia; confirmar chegadas
3. **Walk-in** — particular sem hora (topo da agenda)
4. Após exames → **Gestão** → **Lançamentos** (valor sugerido → Registrar → Ponte **SYNCED**)

### Financeiro
5. **Despesas** — lab, pessoal, insumos, cartão  
6. **Indicadores** — receita, lucro, produção, frascos

### Médico / PJ / Beneficiário (sob demanda)
7. Prestador: fila + extrato  
8. PJ: consumo e faturas  
9. Beneficiário: **Exames** (labels CEDIG)

---

## Massa local (dev)

```bash
npm run db:bootstrap:demo
echo operation > prisma/.data-store-mode
NEXT_PUBLIC_DISABLE_ONBOARDING_AUTO=true npm run dev
./scripts/cedig-mapear.sh
```

| Script | Função |
|--------|--------|
| `scripts/cedig-mapear.sh` | Enrich + semana + lançamentos |
| `scripts/cedig-golive-smoke.sh` | Smoke produção |

Última massa mapeada (26/07): ver timeline em [`STATUS.md`](STATUS.md).
