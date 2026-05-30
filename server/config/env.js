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
  uploadsDir: process.env.UPLOADS_DIR || 'uploads/telegram',
};

module.exports = { env };
