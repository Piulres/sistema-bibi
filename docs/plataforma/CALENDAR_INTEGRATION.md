# Integração de agendas com calendários externos

Sistema Bibi - ServiceOS — **push OAuth** (Google Agenda + Microsoft Outlook/365) e fallback **ICS** (Apple e inscrição por URL).

## Experiência recomendada (melhor caminho)

| Persona | Onde | O que fazer |
|---------|------|-------------|
| **Médico** | `/prestador` | **Conectar** Google ou Microsoft → agenda espelhada com push automático |
| **Operador** | `/interno/agenda` | **Conectar** Google/Microsoft da operação → vê a agenda do tenant |
| **Apple / sem OAuth** | mesmo painel → Feed ICS | Assinar URL secreta |
| **Atendimento avulso** | botão **Calendário** no card | Template Google / Outlook / `.ics` |
| **B2B / Zapier** | `/interno/integracoes` | Webhooks `APPOINTMENT_*` |

Fluxo feliz do médico:

1. Login prestador → painel **Conexão direta** → Conectar Google (ou Microsoft).
2. Autoriza o app no provedor (OAuth).
3. Novos agendamentos, remarcações e cancelamentos são **empurrados** para o calendário em segundos.
4. (Opcional) Feed ICS para Apple no mesmo painel.

## Arquitetura

```mermaid
flowchart LR
  A[create/update/cancel Appointment] --> Q[queueAppointmentCalendarSync]
  Q --> S[calendar-sync-service]
  S --> G[Google Calendar API]
  S --> M[Microsoft Graph]
  S --> Map[AppointmentExternalEvent]
  UI[Conectar] --> OAuth[OAuth start/callback]
  OAuth --> Conn[CalendarConnection]
  Conn --> S
  Feed[CalendarFeed token] --> ICS[/api/calendar/feed/token]
```

| Peça | Papel |
|------|--------|
| `CalendarConnection` | Tokens OAuth cifrados (AES-GCM) por usuário + provedor + escopo |
| `AppointmentExternalEvent` | Mapa `appointmentId` ↔ `externalEventId` (update/delete) |
| `CalendarFeed` | Feed ICS assinável (fallback) |
| Adapters | `src/lib/calendar/providers/{google,microsoft,mock}.ts` |

Escopos:

- `PROVIDER` — só agenda do prestador conectado
- `TENANT` — agenda operacional do tenant (recepção)

## Variáveis de ambiente

```env
# Host público (redirect OAuth + URLs de feed)
NEXT_PUBLIC_SITE_URL=https://seu-dominio.com

# Google Cloud Console → OAuth client (Web)
# Redirect: {SITE}/api/calendar/oauth/google/callback
GOOGLE_CALENDAR_CLIENT_ID=
GOOGLE_CALENDAR_CLIENT_SECRET=

# Azure App Registration → Web redirect
# Redirect: {SITE}/api/calendar/oauth/microsoft/callback
MICROSOFT_CALENDAR_CLIENT_ID=
MICROSOFT_CALENDAR_CLIENT_SECRET=
MICROSOFT_CALENDAR_TENANT=common

# Mock por padrão (até haver apps OAuth reais). Push real: false + CLIENT_* 
CALENDAR_OAUTH_MOCK=true
```

Com `CALENDAR_OAUTH_MOCK` ausente ou `true`, os botões **Conectar** usam adapters mock (não escrevem no Google/Outlook). Tokens OAuth reais são cifrados com chave derivada de `SESSION_SECRET`.

### Setup Google (resumo)

1. Google Cloud Console → APIs → enable **Google Calendar API**
2. Credenciais → OAuth 2.0 Client ID (Web)
3. Authorized redirect URI = `https://<host>/api/calendar/oauth/google/callback`
4. Escopos usados: `calendar.events`, `email`, `openid`

### Setup Microsoft (resumo)

1. Azure Portal → App registration
2. Redirect URI (Web) = `https://<host>/api/calendar/oauth/microsoft/callback`
3. Certificates & secrets → client secret
4. API permissions (delegated): `Calendars.ReadWrite`, `User.Read`, `offline_access`

## APIs

| Método | Path | Auth |
|--------|------|------|
| GET | `/api/prestador/calendar` | Prestador — feed + connections + oauth starts |
| GET | `/api/interno/calendar` | Interno agenda — idem (scope TENANT) |
| DELETE | `/api/{portal}/calendar/connections/{google\|microsoft}` | Desconecta |
| GET | `/api/calendar/oauth/{google\|microsoft}/start` | Inicia OAuth |
| GET | `/api/calendar/oauth/{google\|microsoft}/callback` | Callback |
| GET | `/api/calendar/feed/{token}` | Feed ICS público |
| GET | `/api/{portal}/appointments/{id}/calendar` | Links one-shot + ICS |

Webhooks: `APPOINTMENT_CREATED`, `APPOINTMENT_UPDATED`, `APPOINTMENT_CANCELLED`.

## Segurança

- Access/refresh tokens **nunca** em texto puro no banco
- State OAuth assinado (HMAC) + cookie httpOnly + nonce + TTL 10 min
- `returnTo` só paths internos (`/…`)
- Feed ICS: token opaco = segredo; rotacionar se vazar
- Isolamento por `tenantId` / `userId`

## Limitações atuais

- Sync **outbound** (ServiceOS → calendário). Mudanças feitas só no Google/Outlook não voltam (ainda).
- Duração do evento: **30 min** (slots)
- Um calendário `primary` por conexão

## Validação

```bash
npx prisma db push
npx vitest run tests/lib/calendar-ics.test.ts tests/lib/calendar-oauth.test.ts
# Demo sem secrets:
# CALENDAR_OAUTH_MOCK=true npm run dev
# Login prestador → Conectar Google → mock completa o fluxo
```
