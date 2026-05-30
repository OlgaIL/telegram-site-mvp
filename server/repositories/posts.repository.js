const { query } = require('../db');

async function upsertPost({
  channelId,
  telegramMessageId,
  text,
  caption,
  mediaType,
  mediaUrl,
  telegramFileId,
  mediaStatus,
  originalUrl,
  publishedAt,
  editedAt,
  preserveExistingMedia = false,
}) {
  const result = await query(
    `
      insert into posts (
        channel_id,
        telegram_message_id,
        text,
        caption,
        media_type,
        media_url,
        telegram_file_id,
        media_status,
        original_url,
        published_at,
        edited_at,
        updated_at
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now())
      on conflict (channel_id, telegram_message_id)
      do update set
        text = excluded.text,
        caption = excluded.caption,
        media_type = case when $12 then posts.media_type else excluded.media_type end,
        media_url = case when $12 then posts.media_url else excluded.media_url end,
        telegram_file_id = case when $12 then posts.telegram_file_id else excluded.telegram_file_id end,
        media_status = case when $12 then posts.media_status else excluded.media_status end,
        original_url = excluded.original_url,
        published_at = coalesce(posts.published_at, excluded.published_at),
        edited_at = excluded.edited_at,
        updated_at = now()
      returning *;
    `,
    [
      channelId,
      telegramMessageId,
      text || null,
      caption || null,
      mediaType || 'none',
      mediaUrl || null,
      telegramFileId || null,
      mediaStatus || 'none',
      originalUrl || null,
      publishedAt || null,
      editedAt || null,
      preserveExistingMedia,
    ],
  );

  return result.rows[0];
}

async function findLatestPosts({ limit = 50 } = {}) {
  const result = await query(
    `
      select
        p.id,
        p.channel_id,
        p.telegram_message_id,
        p.text,
        p.caption,
        p.media_type,
        p.media_url,
        p.telegram_file_id,
        p.media_status,
        p.original_url,
        p.published_at,
        p.edited_at,
        p.created_at,
        p.updated_at,
        c.title as channel_title,
        c.username as channel_username
      from posts p
      join channels c on c.id = p.channel_id
      order by coalesce(p.published_at, p.created_at) desc, p.id desc
      limit $1;
    `,
    [limit],
  );

  return result.rows;
}

async function findLatestPostsByChannelId({ channelId, limit = 50 }) {
  const result = await query(
    `
      select
        p.id,
        p.channel_id,
        p.telegram_message_id,
        p.text,
        p.caption,
        p.media_type,
        p.media_url,
        p.telegram_file_id,
        p.media_status,
        p.original_url,
        p.published_at,
        p.edited_at,
        p.created_at,
        p.updated_at,
        c.title as channel_title,
        c.username as channel_username
      from posts p
      join channels c on c.id = p.channel_id
      where p.channel_id = $1
      order by coalesce(p.published_at, p.created_at) desc, p.id desc
      limit $2;
    `,
    [channelId, limit],
  );

  return result.rows;
}

async function findPostById(id) {
  const result = await query(
    `
      select
        p.id,
        p.channel_id,
        p.telegram_message_id,
        p.text,
        p.caption,
        p.media_type,
        p.media_url,
        p.telegram_file_id,
        p.media_status,
        p.original_url,
        p.published_at,
        p.edited_at,
        p.created_at,
        p.updated_at,
        c.title as channel_title,
        c.username as channel_username
      from posts p
      join channels c on c.id = p.channel_id
      where p.id = $1
      limit 1;
    `,
    [id],
  );

  return result.rows[0] || null;
}

async function findPostByIdAndChannelId({ id, channelId }) {
  const result = await query(
    `
      select
        p.id,
        p.channel_id,
        p.telegram_message_id,
        p.text,
        p.caption,
        p.media_type,
        p.media_url,
        p.telegram_file_id,
        p.media_status,
        p.original_url,
        p.published_at,
        p.edited_at,
        p.created_at,
        p.updated_at,
        c.title as channel_title,
        c.username as channel_username
      from posts p
      join channels c on c.id = p.channel_id
      where p.id = $1 and p.channel_id = $2
      limit 1;
    `,
    [id, channelId],
  );

  return result.rows[0] || null;
}

module.exports = {
  findLatestPosts,
  findLatestPostsByChannelId,
  findPostById,
  findPostByIdAndChannelId,
  upsertPost,
};
