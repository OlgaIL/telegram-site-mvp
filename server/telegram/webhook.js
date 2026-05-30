const { logger } = require('../config/logger');
const { saveTelegramChannelPost } = require('../services/post.service');

async function handleTelegramUpdate(update) {
  const post = update.channel_post || update.edited_channel_post;
  const updateType = update.edited_channel_post ? 'edited_channel_post' : 'channel_post';

  if (!post) {
    logger.info({ updateType: Object.keys(update) }, 'telegram update ignored');
    return;
  }

  logger.info(
    {
      updateType,
      chatId: post.chat && post.chat.id,
      messageId: post.message_id,
      hasText: Boolean(post.text),
      hasCaption: Boolean(post.caption),
      hasPhoto: Boolean(post.photo && post.photo.length),
    },
    'telegram channel post detected',
  );

  await saveTelegramChannelPost(post, { isEdited: updateType === 'edited_channel_post' });
}

module.exports = { handleTelegramUpdate };
