# CEDIG — Status vivo

Documento **canônico e vivo** do piloto CEDIG Cruzeiro.  
Agentes e humanos: **atualizem este arquivo** ao fechar entrega, homologação ou mudança de status — não criem `FASE_N.md`, `GO_LIVE_*.md` nem históricos datados novos.

| Campo | Valor |
|-------|-------|
| **Atualizado em** | 2026-07-26 |
| **Produto** | Sistema Bibi - ServiceOS **v3.0.0** |
| **Tenant** | `cedig` · `/?tenant=cedig` · store **operation** |
| **Produção** | https://sistema-bibi.netlify.app · modo operação · CEDIG provisionado |
| **Playbook diário** | [`OPERACAO.md`](OPERACAO.md) |
| **Homologação gestão** | [`HOMOLOGACAO.md`](HOMOLOGACAO.md) |
| **Cliente / preços** | [`README.md`](README.md) |
| **Releases plataforma** | [`../../versoes/RELEASES.md`](../../versoes/RELEASES.md) |

---

## Status agora

| Capacidade | Estado | Nota |
|------------|--------|------|
| Gestão clínica (lançamentos, despesas, KPIs) | ✅ | `/interno/gestao` |
| Agenda + walk-in (modo operação) | ✅ | Persiste com Blobs |
| Ponte PPU (lançamento → Appointment + Usage + Invoice) | ✅ | `bridge.ts` · coluna **SYNCED** |
| Prestador (fila / extrato) | ✅ | Ex.: `bruno.dias@cedig.demo` |
| PJ CentralMed / Bem Saúde / Dr Saúde | ✅ | Consumo + faturas |
| Beneficiário labels **Exame** | ✅ | `useLabels()` |
| Export Excel mensal | ✅ | |
| E2E `e2e/cedig-gestao.spec.ts` | ✅ | |
| Pacote em produção | ✅ | **v3.0.0** |
| Homologação humana in loco | ⏳ | Pendente |
| Treino Alana (15 min) | ⏳ | Usar [`HOMOLOGACAO.md`](HOMOLOGACAO.md) |

**Veredito:** piloto técnico liberado (planilha → gestão + PPU).  
**Não vender** como “4 portais plenos em produção” até aceite humano in loco.

---

## Fluxo ponta a ponta

```text
Alana agenda / walk-in / lança gestão
  → ClinicExamLaunch (SYNCED)
  → Appointment REALIZADO + ProcedureUsage + Invoice/Payment
  → Prestador (fila + extrato)
  → PJ (consumo + fatura convênio)
  → Beneficiário (Exames + faturas)
  → Dashboard / Indicadores
```

Código: `src/lib/clinic-finance/bridge.ts`.

---

## Aceite rápido (15 min)

1. Modo **operação** em `/interno/seguranca`
2. Alana → `/interno/gestao` → 1 lançamento + 1 despesa → KPIs
3. ADMIN → Cadastros → criar prestador de teste
4. `/login?tenant=cedig` com o prestador criado
5. Alana → agenda → walk-in → permanece após F5

### Anti-padrões (“sumiu”)

| Sintoma | Causa | Ação |
|---------|-------|------|
| Walk-in some | Modo **demo** | Segurança → `OPERAR` |
| Login prestador falha | Portal errado | `/login?tenant=cedig` |
| Criar usuário 403 | Conta RECEPÇÃO | Usar `operacao@cedig.demo` |
| Massa vazia no local | Operation sem enrich | `./scripts/cedig-mapear.sh` |

Smoke produção: `bash scripts/cedig-golive-smoke.sh`

---

## Validação local

```bash
npm run db:bootstrap:demo
echo operation > prisma/.data-store-mode
NEXT_PUBLIC_DISABLE_ONBOARDING_AUTO=true npm run dev
./scripts/cedig-mapear.sh
npx playwright test e2e/cedig-gestao.spec.ts --project=chromium
```

---

## Timeline (append-only)

> Novos eventos: **adicione uma linha no topo** da tabela. Não renomeie o arquivo nem abra `HISTORICO_*.md`.

| Data | Evento | Resultado |
|------|--------|----------|
| 2026-07-26 | Docs vivas: status único; removidos FASE_2 / GO_LIVE / HISTORICO / FALHAS fragmentados | ✅ |
| 2026-07-26 | Mapeamento 4 portais + agenda semana (21 exames, 4 walk-ins, 4 SYNCED) | ✅ KPIs 11.750 / 1.600 / 10.150 |
| 2026-07-25 | Produção **v3.0.0** · modo operação · CEDIG provisionado · PWA `/instalar` | ✅ |
| 2026-07-25 | Homologação gestão C1–C4 + correção falhas (labels, walk-in demo, RBAC, Blob) | ✅ |
| 2026-07-25 | Pacote v2.6.0 — pontes PPU + login tenant/portal | ✅ (sucedido por v3.0.0) |
| 2026-07 | Gestão clínica CEDIG (v2.4) + tabelas de preço | ✅ |

### Falhas resolvidas (referência)

Todas as falhas P1–P3 / S2 da homologação 25/07 estão **corrigidas** (labels Exame, walk-in em operação, aliases médicos, `patientId`, RBAC criar usuário, flush Blob, etc.).  
Regressão nova → abra item na timeline + corrija; não revive arquivo `STATUS.md`.

---

## Como manter este doc vivo

1. Mudou capacidade / produção / risco → atualize **Status agora** + linha na **Timeline**.
2. Mudou rotina da secretária → [`OPERACAO.md`](OPERACAO.md).
3. Mudou casos de preço C1–C4 → [`HOMOLOGACAO.md`](HOMOLOGACAO.md).
4. Mudou preço institucional / equipe → [`README.md`](README.md).
5. Fechou pacote plataforma → [`RELEASES.md`](../../versoes/RELEASES.md) (fonte de versão).

**Proibido:** criar `FASE_3.md`, `GO_LIVE_2026.md`, `HISTORICO_2026-08.md` neste diretório.
