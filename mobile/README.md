# Mobile shell — ServiceOS v3.0 (Capacitor)

Pasta reservada para o **app nativo** (WKWebView / WebView) que embute o
Sistema Bibi - ServiceOS. Ainda **não** há scaffold Capacitor commitado — a
Fase A da v3.0 é PWA (`/instalar` + manifest).

## Isolamento

- Não altera `PLATFORM.release` (produção **v3.0.0** — ver [`docs/versoes/RELEASES.md`](../docs/versoes/RELEASES.md)).
- Não entra no `npm run build` do Next.js.
- Trabalho em branches `cursor/serviceos-v3-*`.

## Próximo passo (Fase B)

```bash
npm i @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android --save-dev
npx cap init "ServiceOS" "br.com.sistemabibi.serviceos"
npx cap add ios
npx cap add android
```

No `capacitor.config.ts`, apontar `server.url` para o ambiente desejado
(local, preview ou `https://sistema-bibi.netlify.app`) e sincronizar:

```bash
npx cap sync
npx cap open ios
```

Requer Mac + Apple Developer para iPhone físico / TestFlight.

Ver escopo completo: [`docs/versoes/V3_0.md`](../docs/versoes/V3_0.md).
