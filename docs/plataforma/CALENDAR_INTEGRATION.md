# Integração de agendas com calendários externos

Sistema Bibi - ServiceOS — Google Agenda, Microsoft Outlook / 365, Apple Calendar e qualquer cliente que aceite **ICS (RFC 5545)**.

## Como funciona (escolha por persona)

| Persona | Caminho | O que ganha |
|---------|---------|-------------|
| **Médico / prestador** | `/prestador` → painel “Levar agenda…” | Feed ICS pessoal + botão **Calendário** por atendimento |
| **Operador / recepção** | `/interno/agenda` → painel da operação | Feed ICS do tenant + botão por atendimento |
| **Integrações B2B** | `/interno/integracoes` + webhooks `APPOINTMENT_*` | Zapier/Make → Google Calendar / Graph sem OAuth no Bibi |

Não há OAuth Google/Microsoft nesta versão: a sincronização contínua usa **inscrição por URL** (padrão suportado pelos três grandes). Push OAuth (Graph / Google Calendar API) fica como evolução — ver §Roadmap.

## Fluxos

### 1) Assinar a agenda (sync contínuo)

1. Prestador ou interno gera o link secreto no painel.
2. Copia a URL `/api/calendar/feed/{token}`.
3. No calendário externo:
   - **Google Agenda** → Outros calendários → + → A partir de URL
   - **Outlook** → Adicionar calendário → Subscrever a partir da web
   - **Apple Calendar** → Arquivo → Nova inscrição de calendário
4. O cliente consulta o feed periodicamente; criações, remarcações e cancelamentos refletem no ICS (`STATUS:CANCELLED` quando aplicável).

O token é opaco (32 bytes base64url). **Rotacionar** invalida a URL antiga; **Revogar** desativa o feed.

Escopos:

- `PROVIDER` — só agendamentos do prestador logado
- `TENANT` — agenda operacional do tenant (recepção)

Janela do feed: **7 dias atrás → 90 dias à frente**. Duração implícita do evento: **30 minutos** (igual ao motor de slots).

### 2) Um atendimento avulso

No card da agenda → **Calendário**:

- Abrir template no **Google Agenda**
- Abrir compose no **Outlook** / **Microsoft 365**
- Baixar **`.ics`** (Apple e outros)

APIs:

- `GET /api/prestador/appointments/{id}/calendar`
- `GET /api/interno/appointments/{id}/calendar`
- `?format=ics` → download

### 3) Automação via webhook

Eventos (além dos já existentes):

- `APPOINTMENT_CREATED`
- `APPOINTMENT_UPDATED`
- `APPOINTMENT_CANCELLED`

Úteis para Make/Zapier criarem/atualizarem eventos no Google Calendar ou Microsoft Graph sem armazenar tokens OAuth no ServiceOS.

## Modelo e código

| Peça | Caminho |
|------|---------|
| Prisma `CalendarFeed` | `prisma/schema.prisma` |
| ICS puro | `src/lib/calendar/ics.ts` |
| Mapeamento Appointment → evento | `src/lib/calendar/appointment-event.ts` |
| Links Google/Outlook | `src/lib/calendar/external-links.ts` |
| Feed service | `src/lib/calendar/calendar-feed-service.ts` |
| Feed público | `src/app/api/calendar/feed/[token]/route.ts` |
| UI | `CalendarFeedPanel`, `AddToCalendarMenu` |

## Variáveis

`NEXT_PUBLIC_SITE_URL` (ou `URL` na Netlify) define o host absoluto das URLs de feed. Sem isso, o fallback é a URL canônica de produção — em local, configure o site URL se for testar inscrição real no Google.

## Segurança

- Feed **não** usa cookie de sessão: o segredo é o token na URL.
- Trate o link como senha; não publique em canais abertos.
- Em vazamento → **Rotacionar** ou **Revogar**.
- Isolamento por `tenantId` (+ `providerId` no escopo PROVIDER).

## Roadmap (não neste pacote)

1. OAuth Google Calendar / Microsoft Graph com push bidirecional e `CalendarConnection`
2. Feed do beneficiário (“minha agenda”)
3. Duração configurável por procedimento (hoje fixa em 30 min)
4. Evento `APPOINTMENT_RESCHEDULED` dedicado (hoje cobre-se com `APPOINTMENT_UPDATED`)

## Validação rápida

```bash
npx prisma db push
npx vitest run tests/lib/calendar-ics.test.ts
# UI: login prestador → /prestador → Gerar link → abrir URL do feed no browser (deve baixar/ver VCALENDAR)
```
