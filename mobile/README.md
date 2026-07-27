# Mobile shell — ServiceOS v3.0 (Capacitor)

App nativo **iOS + Android** que embute o Sistema Bibi - ServiceOS via WebView,
apontando para a URL de produção (ou ambiente local durante desenvolvimento).

## Isolamento

- **Não** entra no `npm run build` do Next.js.
- Dependências próprias em `mobile/node_modules`.
- Ícones/splash gerados a partir da **BrandMark** (`npm run mobile:resources` na raiz).

## Pré-requisitos

| Plataforma | Ferramentas |
|------------|-------------|
| Android | Android Studio, JDK 17+ |
| iOS | Mac, Xcode, CocoaPods, conta Apple Developer (TestFlight) |

## Setup (primeira vez)

Na raiz do repositório:

```bash
npm run mobile:resources   # BrandMark → icon/splash nativos + cap sync
cd mobile && npm install
```

## Desenvolvimento

### Produção remota (padrão)

`capacitor.config.json` aponta para `https://sistema-bibi.netlify.app`.
O app abre a PWA publicada — ideal para TestFlight/distribuição interna sem rebuild do Next.

```bash
cd mobile
npx cap sync
npx cap open android   # ou: npx cap open ios
```

### Local (Next.js na máquina)

1. Edite temporariamente `server.url` em `capacitor.config.json`:
   - Emulador Android: `http://10.0.2.2:3000`
   - Simulador iOS: `http://localhost:3000`
   - Dispositivo físico: IP da LAN (`http://192.168.x.x:3000`)
2. `npm run dev` na raiz (porta 3000)
3. `cd mobile && npx cap sync && npx cap run android`

> **Não commitar** URLs locais — reverta para produção antes do PR.

## Scripts (raiz)

| Comando | Ação |
|---------|------|
| `npm run icons:generate` | PNGs PWA (180/192/512/1024) |
| `npm run mobile:resources` | Ícones + splash Capacitor + sync |
| `npm run mobile:sync` | `cap sync` apenas |

## Estrutura

```
mobile/
  android/          # projeto Gradle (launcher BrandMark)
  ios/              # projeto Xcode
  resources/        # icon.png + splash.png (fonte @capacitor/assets)
  www/              # placeholder webDir (conteúdo real vem de server.url)
  capacitor.config.json
```

## Próximos passos (pós Fase B)

- [x] Scaffold `mobile/` (iOS + Android) — v3.0.20
- [x] Service worker shell (`public/sw.js` + `ServiceWorkerRegister`)
- [ ] TestFlight / Play Console (distribuição interna)
- [ ] Deep links por portal (`/interno`, `/prestador`, …)
- [ ] Push notifications (fase futura)

## Service worker (PWA shell)

O app web registra `public/sw.js` via `ServiceWorkerRegister` (montado em `/instalar`).

| Comportamento | Detalhe |
|---------------|---------|
| Cache | `bibi-shell-v1` — precache de `/instalar`, manifest e ícones |
| Estratégia | Cache-first só para shell assets (`/instalar`, `/icons/*`, manifest) |
| Escopo | **Não** cacheia portais autenticados — sessão continua online |
| Testes | `tests/unit/pwa-mobile-shell.test.ts` |

Para regenerar ícones após mudança de marca: `npm run icons:generate` → `npm run mobile:resources`.

Escopo completo: [`docs/versoes/V3_0.md`](../docs/versoes/V3_0.md).
