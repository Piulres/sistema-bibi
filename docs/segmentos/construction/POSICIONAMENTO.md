# Posicionamento — Engenharia Civil (`CONSTRUCTION`)

## Visão

Plataforma para **empresas de Engenharia Civil e empreiteiras** que executam obras, coordenam **equipes de campo** (pedreiros, pintores, eletricistas, engenheiros, arquitetos) e atendem **diversos contratantes** no mesmo tenant: cliente final, escritório de arquitetura, empresa de engenharia, incorporadora.

## Modelos de cobrança

| Modelo | Quando | Implementação |
|--------|--------|---------------|
| **Obra fechada** | Contrato com valor total aprovado | Orçamento → proposta → fatura única (`Budget.invoiceId`) |
| **Diária** | Profissional trabalha por dia | RDO com `diariaAmount` → aprovação interna → `Invoice` por diária |
| **Misto** | Obra fechada + diárias extras | `Project.billingMode = MISTO` |

## Fluxo de campo (RDO)

1. Profissional acessa **Portal de Campo** (`/prestador/campo`)
2. Seleciona obra alocada (tarefa ou gerência)
3. Registra: local/GPS, ofício, execução, pendências, progresso, valor da diária
4. Anexa fotos (`FOTO_CAMPO`)
5. Operação aprova em **Interno → Obra → Campo**; se houver diária, emite fatura

## Personas

| Papel | Portal | Demo |
|-------|--------|------|
| Operação | Interno | `operacao@build.demo` |
| Profissional de campo | Prestador / Campo | `pedreiro.jose@build.demo` |
| Engenheiro | Prestador | `eng.carlos@build.demo` |
| Contratante PJ | PJ | `rh@incorp.demo` |

Senha: `bibi123` · Tenant: `/?tenant=build`

## Homologação (fases entregues)

- Fase 1–4: obras, orçamento, PJ, PDF, Gantt, fatura obra fechada
- **Fase 5 (campo):** `DailyFieldReport`, portal `/prestador/campo`, aprovação + fatura diária
- **Glossário:** Engenharia Civil, Diária, Diário de obra, Portal de Campo
