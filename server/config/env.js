require('dotenv').config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  databaseUrl: process.env.DATABASE_URL || '',
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  telegramWebhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || '',
  telegramProxyUrl: process.env.TELEGRAM_PROXY_URL || '',
  publicBaseUrl: process.env.PUBLIC_BASE_URL || 'http://localhost:3000',
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:3001',
  authFailureRedirectUrl: process.env.AUTH_FAILURE_REDIRECT_URL || 'http://localhost:3001/login?error=oauth_failed',
  sessionCookieName: process.env.SESSION_COOKIE_NAME || 'telegram_site_session',
  sessionTtlDays: Number(process.env.SESSION_TTL_DAYS || 30),
  yandexClientId: process.env.YANDEX_CLIENT_ID || '',
  yandexClientSecret: process.env.YANDEX_CLIENT_SECRET || '',
  yandexCallbackUrl:
    process.env.YANDEX_CALLBACK_URL || 'http://localhost:3000/auth/yandex/callback',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  googleCallbackUrl:
    process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
  uploadsDir: process.env.UPLOADS_DIR || 'uploads/telegram',
};

module.exports = { env };
