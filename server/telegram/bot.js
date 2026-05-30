const { Bot } = require('grammy');
const { env } = require('../config/env');

function createBot() {
  if (!env.telegramBotToken) {
    return null;
  }

  return new Bot(env.telegramBotToken);
}

module.exports = { createBot };
