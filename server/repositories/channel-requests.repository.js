const { query } = require('../db');

async function createChannelRequest({ telegramChannel, email, comment, userId }) {
  const result = await query(
    `
      insert into channel_requests (
        user_id,
        telegram_channel,
        email,
        comment,
        status,
        updated_at
      )
      values ($1, $2, $3, $4, 'new', now())
      returning *;
    `,
    [userId || null, telegramChannel, email, comment || null],
  );

  return result.rows[0];
}

async function findLatestChannelRequestsByUserId({ userId, limit = 20 } = {}) {
  const result = await query(
    `
      select
        id,
        user_id,
        telegram_channel,
        email,
        comment,
        status,
        created_at,
        updated_at
      from channel_requests
      where user_id = $1
      order by created_at desc, id desc
      limit $2;
    `,
    [userId, limit],
  );

  return result.rows;
}

async function findLatestChannelRequests({ limit = 50 } = {}) {
  const result = await query(
    `
      select
        id,
        user_id,
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

module.exports = {
  createChannelRequest,
  findLatestChannelRequests,
  findLatestChannelRequestsByUserId,
};
