const express = require('express');
const { logger } = require('../config/logger');
const { env } = require('../config/env');
const { handleTelegramUpdate } = require('../telegram/webhook');

const telegramRouter = express.Router();

telegramRouter.post('/webhook', async (req, res) => {
  try {
    if (env.telegramWebhookSecret) {
      const secret = req.get('X-Telegram-Bot-Api-Secret-Token');

      if (secret !== env.telegramWebhookSecret) {
        logger.warn('telegram webhook rejected: invalid secret');
        return res.status(401).json({ ok: false });
      }
    }

    logger.info({ updateId: req.body.update_id }, 'webhook received');
    await handleTelegramUpdate(req.body);

    return res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, 'telegram webhook failed');
    return res.status(200).json({ ok: true });
  }
});

module.exports = { telegramRouter };
