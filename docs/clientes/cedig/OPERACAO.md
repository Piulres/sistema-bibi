# CEDIG — Operação (playbook)

Rotina diária do piloto. Status e timeline: [`STATUS.md`](STATUS.md).  
Homologação de preços: [`HOMOLOGACAO.md`](HOMOLOGACAO.md). Cliente/preços: [`README.md`](README.md).

> **Tenant:** `/?tenant=cedig` · **Store:** operação · **Senha:** `bibi123`  
> **Produção:** ServiceOS **v3.0.24** · https://sistema-bibi.netlify.app

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

> **Mobile (v3.0.7):** no celular, lançamentos aparecem em cards legíveis; use o drawer de navegação (ícone do módulo ativo, abre pela direita) para trocar de módulo. Doc: [`../../produto/FLUXOS.md`](../../produto/FLUXOS.md) §4.2.1.

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
| `scripts/reset-cedig-transactional.mjs` | Zera atendimentos/fluxos; mantém usuários, exames e preços |
| `scripts/cedig-ensure-commercial.ts` | Garante empresas + PricingRules (sem pacientes) |
| `scripts/publish-operation-blob.mjs` | Republica `operation.db` no Blob com `updatedAt` |

### Limpar fluxos (voltar ao “zero operacional”)

Remove agenda, lançamentos, faturas, PEP e pacientes de teste do tenant `cedig`.  
**Mantém:** equipe, catálogo de exames (`basePrice`) e, após o ensure comercial, empresas/tabelas de preço.

```bash
# 1) Baixar cópia + backup
npx netlify blobs:get bibi-databases operation.db --output /tmp/operation.db
cp /tmp/operation.db /tmp/operation.backup.db

# 2) Preview e aplicar
node scripts/reset-cedig-transactional.mjs /tmp/operation.db --confirm=LIMPAR-FLUXOS --dry-run
node scripts/reset-cedig-transactional.mjs /tmp/operation.db --confirm=LIMPAR-FLUXOS
DATABASE_URL="file:/tmp/operation.db" npx tsx scripts/cedig-ensure-commercial.ts

# 3) Republicar (produção)
node scripts/publish-operation-blob.mjs /tmp/operation.db
```

Última massa mapeada / limpeza: ver timeline em [`STATUS.md`](STATUS.md).
