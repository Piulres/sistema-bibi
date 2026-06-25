# Integração Voa Health — Sistema Bibi

Documentação técnica da integração com a [Voa Health](https://voa.health/), assistente de IA para transcrição de consultas e geração de documentos clínicos (anamnese, SOAP, evolução).

**Planejamento:** [`PLANO_V1_4_VOA.md`](PLANO_V1_4_VOA.md)  
**Docs oficiais Voa:** https://docs.voa.health/  
**Suporte integração:** integration@voahealth.com

---

## 1. O que é a Voa

| Aspecto | Descrição |
|---------|-----------|
| **Produto** | SaaS de IA que transcreve consultas (presencial ou telemedicina) e gera documentação clínica estruturada |
| **Público** | Médicos e equipes clínicas |
| **Diferencial** | Reduz digitação no PEP; suporta compartilhamento de áudio de Meet/Zoom/Teams em telemedicina |
| **Charcot** | Chat de apoio à decisão com base em evidências científicas |
| **Não é** | Prontuário completo, ERP ou faturamento — é um **módulo embed** no PEP |

---

## 2. Posicionamento no Bibi

O Bibi já possui:

- **Agendamento** com modalidade `PRESENCIAL` | `TELE` (`Appointment`)
- **Atendimento prestador** (`/prestador/atendimento/[id]` → `AtendimentoView`)
- **PEP** (`MedicalRecord` — `ANAMNESE`, `EVOLUCAO`, `RECEITA`, `ATESTADO`)
- **Perfil clínico** (`PatientClinicalProfile` — alergias, crônicos)
- **Telemedicina mock** (`TELEMEDICINE_BASE_URL`)
- **Auditoria** (`TimelineEvent`)
- **Padrão adapter** (pagamentos, comunicação) — Voa segue o mesmo modelo

A Voa **complementa** o fluxo clínico na aba de atendimento, sem substituir cadastros, faturamento Pay Per Use ou estoque.

---

## 3. Modos de integração (Voa)

| Modo | Uso no Bibi | Referência |
|------|-------------|------------|
| **Plugin JS** | **Fase 1 (escolhido)** — embed no `AtendimentoView` | [Plugin](https://docs.voa.health/integracao/plugin.md) |
| **iFrame** | Fallback se CSP bloquear script externo | [iFrame](https://docs.voa.health/integracao/iframe/autenticacao.md) |
| **App mobile** | Fora de escopo (médico usa app Voa standalone) | Google Play |
| **RNDS** | Fase 3 enterprise (certificado A1 + DATASUS) | [RNDS](https://docs.voa.health/rnds/como-funciona.md) |

### Plugin — fluxo resumido

1. Carregar `https://integration.voa.health/plugin.js`
2. `VoaPlugin.instance.init({ token })`
3. `VoaPlugin.instance.mount({ doctorId, patientId, consultationId, options })`
4. Ouvir eventos `postMessage` na página host
5. `VoaPlugin.instance.unmount()` ao sair do atendimento

---

## 4. Mapeamento de entidades

| Campo Voa | Entidade Bibi | Notas |
|-----------|---------------|-------|
| `doctorId` | `User.id` | Prestador logado (`role=PRESTADOR`) |
| `patientId` | `Patient.id` | Beneficiário do agendamento |
| `consultationId` | `Appointment.id` | ID estável por atendimento |
| `consultationType` | `Appointment.modality` | `PRESENCIAL` → `IN_PERSON`; `TELE` → `TELEMEDICINE` |
| Documento texto | `MedicalRecord.content` | Markdown da Voa |
| Tipo de registro | `MedicalRecord.recordType` | Default `ANAMNESE`; mapeável por template |
| Título | `MedicalRecord.title` | `template.name` da Voa ou "Anamnese (Voa)" |
| Especialidade | `User.specialty` | Influencia modelos Voa (fase 2) |

---

## 5. Eventos do plugin (host ← Voa)

Fonte: [Mensagens do plugin](https://docs.voa.health/integracao/plugin/mensagens)

### `voa.plugin.ehr.fill`

Disparado quando o médico clica em **Preencher prontuário** (`enableFillEhr: true`).

```json
{
  "eventName": "voa.plugin.ehr.fill",
  "eventData": {
    "document": "# markdown do documento",
    "template": {
      "id": "",
      "name": "Anamnese padrão",
      "slug": "anamnese-padrao"
    }
  }
}
```

### `voa.plugin.ehr.structured_output`

Opcional — quando `structuredOutputSchema` é informado no `mount`.

```json
{
  "eventName": "voa.plugin.ehr.structured_output",
  "eventData": {
    "output": {},
    "from_cache": false
  }
}
```

**Regra:** inscrever-se em **ambos** os eventos; o estruturado pode chegar depois do texto.

### Outros eventos (iframe — referência futura)

- `CONSULTATION_STARTED` / `CONSULTATION_COMPLETED`
- `DOCUMENT_GENERATED`
- `TRANSCRIPTION_UPDATE`

---

## 6. Arquitetura Bibi

```
┌─────────────────────────────────────────────────────────────┐
│  AtendimentoView (client)                                    │
│  ┌─────────────────┐  ┌──────────────────────────────────┐  │
│  │ Abas clínicas   │  │ VoaAssistantPanel                 │  │
│  │ PEP / proced.   │  │  - Script plugin.js               │  │
│  └─────────────────┘  │  - mount(doctor, patient, appt) │  │
│                        │  - listener postMessage           │  │
│                        └──────────────┬───────────────────┘  │
└───────────────────────────────────────┼─────────────────────┘
                                        │ fill / structured_output
                                        ▼
                    POST /api/prestador/appointments/[id]/voa/import
                                        │
                                        ▼
                              MedicalRecord + TimelineEvent
```

### APIs (Fase 1)

| Rota | Método | Função |
|------|--------|--------|
| `/api/prestador/appointments/[id]/voa` | GET | Config de mount + token (sessão prestador) |
| `/api/prestador/appointments/[id]/voa/import` | POST | Persiste documento Voa no PEP |

O token de integração **nunca** vai em `NEXT_PUBLIC_*`; o client obtém via GET autenticado.

---

## 7. Variáveis de ambiente

| Variável | Obrigatória | Default | Descrição |
|----------|-------------|---------|-----------|
| `VOA_ENABLED` | Não | `false` | Habilita UI e APIs Voa |
| `VOA_INTEGRATION_TOKEN` | Sim (se enabled) | — | Token fornecido pela Voa (`init`) |
| `VOA_ENV` | Não | `homologacao` | `homologacao` (`sk_user_*`) ou `producao` (futuro) |
| `VOA_PLUGIN_SCRIPT_URL` | Não | `https://integration.voa.health/plugin.js` | URL do script |
| `VOA_IDENTIFY_URL` | Não | `https://api.voa.health/integration/identify/` | API identify (fase 2) |

Detalhes: [`VARIAVEIS_AMBIENTE.md`](VARIAVEIS_AMBIENTE.md) § Integrações — Voa.

---

## 8. LGPD e consentimento

| Requisito | Implementação Bibi |
|-----------|-------------------|
| Dados sensíveis (áudio) processados por terceiro | Exibir aviso antes de abrir Voa |
| Consentimento do paciente | Verificar `Patient.consentAt` (bloquear se ausente em produção) |
| Auditoria | `TimelineEvent` com action `VOA_DOCUMENT_IMPORTED` |
| Opt-in por tenant | `VOA_ENABLED` + futuro flag em config tenant (fase 2) |
| DPA | Contrato com Voa Health (operacional — fora do código) |

---

## 9. Autenticação (produção)

**POC (Fase 1):** token estático `VOA_INTEGRATION_TOKEN` repassado ao client após `requireUser(["PRESTADOR"])`.

**Produção (Fase 2):** proxy server-side:

```http
POST https://api.voa.health/integration/identify/
x-voa-token: {VOA_AUTH_TOKEN}
Content-Type: application/json

{
  "consultation_id": "{appointmentId}",
  "doctor_id": "{providerId}",
  "patient_id": "{patientId}"
}
```

Retorno: Bearer token efêmero para `init` — sem expor token mestre no browser.

---

## 10. Modelos por especialidade (Fase 2)

A Voa documenta templates por área (cardiologia, pediatria, SOAP, etc.). Mapeamento proposto:

| `User.specialty` (Bibi) | Slug sugerido Voa |
|-------------------------|-------------------|
| Clínica Geral | `anamnese-padrao` |
| Cardiologia | `cardiologia` |
| Pediatria | `pediatria` |
| Psiquiatria | `psiquiatria` |
| (default) | `anamnese-padrao` |

---

## 11. Telemedicina

Quando `Appointment.modality === "TELE"`:

- `consultationType: "TELEMEDICINE"`
- `allowScreenSharing: true` (captura áudio da guia Meet/Zoom)
- Link existente: `Appointment.telemedicineUrl`

---

## 12. Referências externas

- Site: https://voa.health/
- Docs índice: https://docs.voa.health/llms.txt
- Plugin fluxo: https://docs.voa.health/integracao/plugin/fluxo-de-uso
- Mensagens: https://docs.voa.health/integracao/plugin/mensagens
- Output estruturado: https://docs.voa.health/integracao/plugin/output-estruturado
- Contato: integration@voahealth.com
