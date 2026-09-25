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
        r.id,
        r.user_id,
        r.telegram_channel,
        r.email,
        r.comment,
        r.status,
        r.site_id,
        s.slug as site_slug,
        r.created_at,
        r.updated_at
      from channel_requests r
      left join sites s on s.id = r.site_id
      where r.user_id = $1
      order by r.created_at desc, r.id desc
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
        r.id,
        r.user_id,
        r.telegram_channel,
        r.email,
        r.comment,
        r.status,
        r.site_id,
        s.slug as site_slug,
        r.created_at,
        r.updated_at
      from channel_requests r
      left join sites s on s.id = r.site_id
      order by r.created_at desc, r.id desc
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
