function toIsoString(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return new Date(value).toISOString();
}

function presentPost(row) {
  const content = row.text || row.caption || null;

  return {
    id: row.id,
    channel: {
      id: row.channel_id,
      title: row.channel_title,
      username: row.channel_username,
    },
    telegramMessageId: row.telegram_message_id,
    text: row.text,
    caption: row.caption,
    content,
    media: {
      type: row.media_type,
      url: row.media_url,
      telegramFileId: row.telegram_file_id,
      status: row.media_status,
    },
    originalUrl: row.original_url,
    publishedAt: toIsoString(row.published_at),
    editedAt: toIsoString(row.edited_at),
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  };
}

module.exports = { presentPost };
