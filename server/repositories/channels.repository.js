const { query } = require('../db');

async function upsertChannel({ telegramChatId, username, title }) {
  const result = await query(
    `
      insert into channels (telegram_chat_id, username, title, updated_at)
      values ($1, $2, $3, now())
      on conflict (telegram_chat_id)
      do update set
        username = excluded.username,
        title = excluded.title,
        updated_at = now()
      returning *;
    `,
    [telegramChatId, username || null, title || null],
  );

  return result.rows[0];
}

module.exports = { upsertChannel };
