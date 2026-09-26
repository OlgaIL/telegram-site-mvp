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

async function findDetectedChannels() {
  const result = await query(`
    select
      c.id,
      c.telegram_chat_id,
      c.username,
      c.title,
      c.created_at as detected_at,
      s.slug as site_slug
    from channels c
    left join sites s on s.channel_id = c.id
    where exists (select 1 from posts p where p.channel_id = c.id)
    order by c.updated_at desc, c.id desc;
  `);

  return result.rows;
}

module.exports = { upsertChannel, findDetectedChannels };
