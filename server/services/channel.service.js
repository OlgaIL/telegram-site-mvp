const { logger } = require('../config/logger');
const { upsertChannel } = require('../repositories/channels.repository');

async function detectChannel(chat) {
  if (!chat || !chat.id) {
    throw new Error('Telegram channel chat is missing');
  }

  const channel = await upsertChannel({
    telegramChatId: chat.id,
    username: chat.username,
    title: chat.title,
  });

  logger.info(
    {
      channelId: channel.id,
      telegramChatId: channel.telegram_chat_id,
      username: channel.username,
    },
    'channel detected',
  );

  return channel;
}

module.exports = { detectChannel };
