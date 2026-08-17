# Telegram Site MVP

MVP service: write posts in a Telegram channel, receive them through a bot webhook, store them in PostgreSQL, and publish them through an API and a Next.js frontend.

## Architecture

```text
Telegram channel
  -> Telegram bot webhook
  -> Express API/backend
  -> PostgreSQL + uploads/telegram
  -> Public API
  -> Next.js customer-facing frontend
```

Project layout:

```text
server/   Express backend, Telegram ingestion, API, technical EJS feed
client/   Next.js frontend for the customer-facing site
docs/     API and operational notes
uploads/  downloaded Telegram media
```

## Local Setup

Install backend dependencies:

```bash
cd C:\Users\olgak\PROJECTS\telegram-site-mvp
npm.cmd install
```

Install frontend dependencies:

```bash
cd C:\Users\olgak\PROJECTS\telegram-site-mvp\client
npm.cmd install
```

Create local env files from examples:

```text
.env
client/.env.local
```

Run database migrations:

```bash
cd C:\Users\olgak\PROJECTS\telegram-site-mvp
npm.cmd run db:migrate
```

## Development

Run backend and frontend together:

```bash
cd C:\Users\olgak\PROJECTS\telegram-site-mvp
npm.cmd run dev
```

Or run them separately:

```bash
npm.cmd run dev:api
npm.cmd run dev:client
```

Local URLs:

```text
Backend health: http://localhost:3000/health
API posts:      http://localhost:3000/api/posts
Technical feed: http://localhost:3000/feed
Frontend site:  http://localhost:3001/
Login:          http://localhost:3001/login
Dashboard:      http://localhost:3001/dashboard
```

## Telegram Live Test

1. Start backend and frontend:

```bash
npm.cmd run dev
```

2. Start ngrok in another terminal:

```bash
ngrok http 3000
```

3. Set Telegram webhook to:

```text
https://<ngrok-host>/telegram/webhook
```

4. Send a text post and a photo post to the test channel.

5. Check:

```text
http://localhost:3000/api/posts
http://localhost:3001/
```

## Environment

Backend `.env`:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/telegram_site_mvp
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
TELEGRAM_PROXY_URL=
PUBLIC_BASE_URL=http://localhost:3000
FRONTEND_ORIGIN=http://localhost:3001
AUTH_FAILURE_REDIRECT_URL=http://localhost:3001/login?error=oauth_failed
SESSION_COOKIE_NAME=telegram_site_session
SESSION_TTL_DAYS=30

YANDEX_AUTH_ENABLED=true
YANDEX_CLIENT_ID=
YANDEX_CLIENT_SECRET=
YANDEX_CALLBACK_URL=http://localhost:3000/auth/yandex/callback

GOOGLE_AUTH_ENABLED=true
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

VK_AUTH_ENABLED=false
VK_CLIENT_ID=
# VK ID uses PKCE. This value is optional and is not used by the current flow.
VK_CLIENT_SECRET=
VK_CALLBACK_URL=http://localhost:3000/auth/vk/callback

UPLOADS_DIR=uploads/telegram
```

Frontend `client/.env.local`:

```env
API_BASE_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_TITLE=Test Site Tele
NEXT_PUBLIC_SITE_DESCRIPTION=Telegram-powered updates
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=@your_service_bot
```

## Current Status

Done:

```text
Telegram webhook
Text posts
Photo posts and local media download
PostgreSQL persistence
Technical feed /feed and /feed/:id
Read-only API /api/posts and /api/posts/:id
Site API /api/sites/:slug/posts and /api/sites/:slug/posts/:id
Channel lookup API /api/channels/lookup
Channel request API /api/channel-requests
Next.js frontend /, /site/:slug, /site/:slug/post/:id
Channel request page /add-channel
Internal draft admin /admin/channel-requests
Client-side auto-refresh for site feeds
Yandex OAuth foundation
Google OAuth route scaffold
Auth session cookie and /api/me
Dashboard draft /dashboard
```

Backlog:

```text
Domain and subdomain routing
Google OAuth credentials and live test
User-site ownership
Site settings UI
Widget production hardening
VPS deployment
```
