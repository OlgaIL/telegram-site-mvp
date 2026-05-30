const { logger } = require('../config/logger');
const { upsertPost } = require('../repositories/posts.repository');
const { detectChannel } = require('./channel.service');
const { processTelegramPhoto, selectLargestPhoto } = require('./media.service');

function toTelegramDate(unixSeconds) {
  if (!unixSeconds) {
    return null;
  }

  return new Date(unixSeconds * 1000);
}

function buildOriginalUrl(chat, messageId) {
  if (!chat || !chat.username || !messageId) {
    return null;
  }

  return `https://t.me/${chat.username}/${messageId}`;
}

async function saveTelegramChannelPost(post, { isEdited = false } = {}) {
  const channel = await detectChannel(post.chat);
  const selectedPhoto = selectLargestPhoto(post.photo);
  const media = await processTelegramPhoto(selectedPhoto);
  const preserveExistingMedia = isEdited && !selectedPhoto;

  const savedPost = await upsertPost({
    channelId: channel.id,
    telegramMessageId: post.message_id,
    text: post.text || null,
    caption: post.caption || null,
    mediaType: media.mediaType,
    mediaUrl: media.mediaUrl,
    telegramFileId: media.telegramFileId,
    mediaStatus: media.mediaStatus,
    originalUrl: buildOriginalUrl(post.chat, post.message_id),
    publishedAt: toTelegramDate(post.date),
    editedAt: isEdited ? toTelegramDate(post.edit_date) || new Date() : null,
    preserveExistingMedia,
  });

  logger.info(
    {
      postId: savedPost.id,
      channelId: savedPost.channel_id,
      telegramMessageId: savedPost.telegram_message_id,
    },
    isEdited ? 'post updated' : 'post saved',
  );

  return savedPost;
}

module.exports = { saveTelegramChannelPost };
