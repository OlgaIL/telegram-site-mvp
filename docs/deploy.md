# Production Deployment: tg4you.ru

The first production release uses one public domain. Nginx sends API, OAuth, webhook and media paths to Express, and all other requests to Next.js.

```text
https://tg4you.ru/                  Next.js
https://tg4you.ru/api/...           Express API
https://tg4you.ru/auth/...          OAuth callbacks
https://tg4you.ru/telegram/webhook  Telegram webhook
https://tg4you.ru/uploads/...       Telegram media
```

## Server layout

```text
/var/www/tg4you.ru/
  app/                         Git repository
  shared/uploads/telegram/     Persistent media outside the repository
```

The project uses PM2 and does not change the existing `myworld-server` process on port `4000`.

```text
tg4you-api  -> 127.0.0.1:3100
tg4you-web  -> 127.0.0.1:3101
```

## DNS

Create these records in the DNS zone for `tg4you.ru`:

```text
A      @       <VPS public IPv4>
CNAME  www     tg4you.ru
```

Do not add wildcard subdomains yet. They will be configured after the base domain is stable.

## First server setup

Run these commands on the VPS as root after DNS begins resolving to the VPS:

```bash
mkdir -p /var/www/tg4you.ru/shared/uploads/telegram
git clone https://github.com/OlgaIL/telegram-site-mvp.git /var/www/tg4you.ru/app
cd /var/www/tg4you.ru/app
npm ci
npm ci --prefix client
cp .env.example .env
cp client/.env.production.example client/.env.production
```

Fill in the production `.env` files. Do not commit them.

Required backend values:

```env
NODE_ENV=production
PORT=3100
PGPASSWORD=<database user password>
DATABASE_URL=postgresql://tg4you_app@<database public IP>:5432/tg4you
DATABASE_SSL_CA_FILE=/var/www/tg4you.ru/shared/certs/timeweb-ca.crt
DATABASE_SSL_SERVERNAME=<Timeweb technical database hostname>
PUBLIC_BASE_URL=https://tg4you.ru
FRONTEND_ORIGIN=https://tg4you.ru
AUTH_FAILURE_REDIRECT_URL=https://tg4you.ru/login?error=oauth_failed
UPLOADS_DIR=/var/www/tg4you.ru/shared/uploads/telegram

YANDEX_CALLBACK_URL=https://tg4you.ru/auth/yandex/callback
GOOGLE_CALLBACK_URL=https://tg4you.ru/auth/google/callback
VK_CALLBACK_URL=https://tg4you.ru/auth/vk/callback
VK_AUTH_ENABLED=false
```

Required client values:

```env
API_BASE_URL=http://127.0.0.1:3100
NEXT_PUBLIC_API_BASE_URL=https://tg4you.ru
```

Run the migration and build before starting PM2:

```bash
npm run db:migrate
npm run build --prefix client
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

`pm2 startup` prints one extra command. Run that command and then run `pm2 save` again.

## Nginx and HTTPS

```bash
cp deploy/nginx/tg4you.ru.conf /etc/nginx/sites-available/tg4you.ru
ln -s /etc/nginx/sites-available/tg4you.ru /etc/nginx/sites-enabled/tg4you.ru
nginx -t
systemctl reload nginx
certbot --nginx -d tg4you.ru -d www.tg4you.ru
```

After Certbot, verify:

```bash
curl -I https://tg4you.ru
curl https://tg4you.ru/health
pm2 list
```

## Telegram and OAuth

After HTTPS is working:

1. Set the Telegram webhook to `https://tg4you.ru/telegram/webhook`.
2. Replace OAuth callback URLs in Yandex and Google consoles with the production URLs above.
3. Keep VK disabled until its OAuth flow is verified on the production domain.

## Update release

```bash
cd /var/www/tg4you.ru/app
git pull
npm ci
npm ci --prefix client
npm run db:migrate
npm run build --prefix client
pm2 reload ecosystem.config.cjs --update-env
```

## Backups

Back up the separate PostgreSQL database and `/var/www/tg4you.ru/shared/uploads/telegram/` to the existing backup storage. Keep the media backup path separate from Word2you.
