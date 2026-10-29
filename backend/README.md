# Voha FastAPI integration

The frontend posts the raw `Telegram.WebApp.initData` to `/api/auth/telegram`; the Node server forwards this to `/auth/telegram` on the existing backend. The API must issue real Voha access/refresh tokens so chats and orders keep working.

1. Copy `telegram_auth.py` to `app/routers/telegram_auth.py` in the Voha FastAPI project.
2. In `app/main.py`, add:

   ```python
   from app.routers import telegram_auth
   app.include_router(telegram_auth.router, prefix="/auth", tags=["Auth"])
   ```

3. Set `MINI_APP_BOT_TOKEN` in the **backend** process environment to the token of the bot that launches this Mini App. This is distinct from any notification bot token. Restart/deploy the API.
4. Host the frontend with HTTPS and configure that URL in BotFather.

The endpoint validates HMAC-SHA256, rejects duplicate fields and init data older than five minutes, and uses the existing user/session services. No database migration is needed: Telegram-only accounts use the reserved `tg:<Telegram ID>` identifier in the existing phone column. This is an internal identity, not a phone number; the Mini App displays “Telegram akkaunti”. Phone OTP cannot claim this namespace. Existing phone accounts are separate; automatic merging by name or username is deliberately unsupported.

Telegram tokens and init data must never be logged or committed. The live upstream must be updated before Telegram login can work; deploying only this frontend is insufficient. Validation follows https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app.
