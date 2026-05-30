const { query } = require('../db');

async function createChannelRequest({ telegramChannel, email, comment }) {
  const result = await query(
    `
      insert into channel_requests (
        telegram_channel,
        email,
        comment,
        status,
        updated_at
      )
      values ($1, $2, $3, 'new', now())
      returning *;
    `,
    [telegramChannel, email, comment || null],
  );

  return result.rows[0];
}

async function findLatestChannelRequests({ limit = 50 } = {}) {
  const result = await query(
    `
      select
        id,
        telegram_channel,
        email,
        comment,
        status,
        created_at,
        updated_at
      from channel_requests
      order by created_at desc, id desc
      limit $1;
    `,
    [limit],
  );

  return result.rows;
}

module.exports = { createChannelRequest, findLatestChannelRequests };
