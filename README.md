# VohaOne Telegram Mini App

React + TypeScript web adaptation of the Voha Android application. Includes an API-backed Discover catalogue, nearby stores, search, phone/OTP authentication, text chats, contacts, profile editing and store orders.

## Run locally

Requires Node.js 22.9+.

```bash
npm ci
npm run build
npm start
```

Open http://127.0.0.1:3000. The Node server serves the production build and forwards `/api` requests to the Voha backend.

For development, keep `npm start` running for the API proxy and run `npm run dev` in another terminal.

## Configuration

Copy `.env.miniapp.example` to `.env.miniapp`. Set `API_BASE_URL` to your backend and optionally adjust `PORT` and `HOST`. Secrets must remain in this local file.

Telegram requires a public HTTPS URL configured in BotFather. The optional launcher can be started with `npm run bot` after configuring `BOT_TOKEN` and `MINI_APP_URL`. Inside Telegram, login automatically sends signed init data to the backend and creates a Voha session. Phone/OTP remains available in the browser. Deploy the backend endpoint described in [backend/README.md](backend/README.md) and set MINI_APP_BOT_TOKEN in the backend environment.

## Checks

```bash
npm run build
npx playwright install chromium
# With npm start running:
npx playwright test tests/discover.spec.js --workers=1
```

The Discover tests cover catalogue search, navigation, retry handling and location query parameters. Native Android push notifications, background workers and full market administration are not ported.
