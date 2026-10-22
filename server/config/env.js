require('dotenv').config();

function readBoolean(value, defaultValue) {
  if (value === undefined || value === '') {
    return defaultValue;
  }

  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function readEmailList(value) {
  return String(value || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function readPositiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  databaseUrl: process.env.DATABASE_URL || '',
  databaseSslCaFile: process.env.DATABASE_SSL_CA_FILE || '',
  databaseSslServername: process.env.DATABASE_SSL_SERVERNAME || '',
  adminEmails: readEmailList(process.env.ADMIN_EMAILS),
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  telegramWebhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || '',
  telegramProxyUrl: process.env.TELEGRAM_PROXY_URL || '',
  publicBaseUrl: process.env.PUBLIC_BASE_URL || 'http://localhost:3000',
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:3001',
  authFailureRedirectUrl: process.env.AUTH_FAILURE_REDIRECT_URL || 'http://localhost:3001/login?error=oauth_failed',
  sessionCookieName: process.env.SESSION_COOKIE_NAME || 'telegram_site_session',
  sessionTtlDays: Number(process.env.SESSION_TTL_DAYS || 30),
  emailAuthEnabled: readBoolean(process.env.EMAIL_AUTH_ENABLED, false),
  emailOtpSecret: process.env.EMAIL_OTP_SECRET || '',
  emailAuthCodeTtlMinutes: readPositiveInteger(process.env.EMAIL_AUTH_CODE_TTL_MINUTES, 10),
  emailAuthResendSeconds: Math.max(10, readPositiveInteger(process.env.EMAIL_AUTH_RESEND_SECONDS, 60)),
  emailAuthMaxAttempts: readPositiveInteger(process.env.EMAIL_AUTH_MAX_ATTEMPTS, 5),
  emailAuthEmailRequestsPerHour: readPositiveInteger(process.env.EMAIL_AUTH_EMAIL_REQUESTS_PER_HOUR, 5),
  emailAuthIpRequestsPerHour: readPositiveInteger(process.env.EMAIL_AUTH_IP_REQUESTS_PER_HOUR, 20),
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: readPositiveInteger(process.env.SMTP_PORT, 465),
  smtpSecure: readBoolean(process.env.SMTP_SECURE, Number(process.env.SMTP_PORT || 465) === 465),
  smtpUser: process.env.SMTP_USER || '',
  smtpPassword: process.env.SMTP_PASSWORD || '',
  smtpFrom: process.env.SMTP_FROM || '',
  yandexAuthEnabled: readBoolean(process.env.YANDEX_AUTH_ENABLED, true),
  yandexClientId: process.env.YANDEX_CLIENT_ID || '',
  yandexClientSecret: process.env.YANDEX_CLIENT_SECRET || '',
  yandexCallbackUrl:
    process.env.YANDEX_CALLBACK_URL || 'http://localhost:3000/auth/yandex/callback',
  googleAuthEnabled: readBoolean(process.env.GOOGLE_AUTH_ENABLED, true),
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  googleCallbackUrl:
    process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
  vkAuthEnabled: readBoolean(process.env.VK_AUTH_ENABLED, false),
  vkClientId: process.env.VK_CLIENT_ID || '',
  vkClientSecret: process.env.VK_CLIENT_SECRET || '',
  vkCallbackUrl: process.env.VK_CALLBACK_URL || 'http://localhost:3000/auth/vk/callback',
  uploadsDir: process.env.UPLOADS_DIR || 'uploads/telegram',
};

module.exports = { env };
