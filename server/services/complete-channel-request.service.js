const { pool } = require('../db');

class CompletionError extends Error {
  constructor(message, status = 409) {
    super(message);
    this.status = status;
  }
}

async function completeChannelRequest({ requestId, channelId }) {
  const client = await pool.connect();

  try {
    await client.query('begin');

    const requestResult = await client.query(
      'select id, status, site_id from channel_requests where id = $1 for update',
      [requestId],
    );
    const request = requestResult.rows[0];

    if (!request) {
      throw new CompletionError('Заявка не найдена.', 404);
    }

    if (request.site_id || request.status === 'done' || request.status === 'rejected') {
      throw new CompletionError('Эту заявку уже нельзя подключить.');
    }

    const channelResult = await client.query(
      'select id, title, username from channels where id = $1 for update',
      [channelId],
    );
    const channel = channelResult.rows[0];

    if (!channel) {
      throw new CompletionError('Канал не найден.', 404);
    }

    const postResult = await client.query('select 1 from posts where channel_id = $1 limit 1', [channel.id]);

    if (!postResult.rows.length) {
      throw new CompletionError('Сначала дождитесь нового поста канала.');
    }

    const existingSite = await client.query('select id from sites where channel_id = $1 limit 1', [channel.id]);

    if (existingSite.rows.length) {
      throw new CompletionError('У этого канала уже есть сайт.');
    }

    const title = channel.title || channel.username || `Канал ${channel.id}`;
    const baseSlug = `channel-${channel.id}-${request.id}`;
    let site;

    for (let suffix = 0; suffix < 100; suffix += 1) {
      const slug = suffix ? `${baseSlug}-${suffix + 1}` : baseSlug;
      const siteResult = await client.query(
        `
          insert into sites (channel_id, name, slug, title, description, updated_at)
          values ($1, $2, $3, $2, $4, now())
          on conflict (slug) do nothing
          returning id, slug;
        `,
        [channel.id, title, slug, 'Telegram-powered updates'],
      );

      if (siteResult.rows.length) {
        site = siteResult.rows[0];
        break;
      }
    }

    if (!site) {
      throw new CompletionError('Не удалось выбрать свободный адрес сайта.');
    }

    await client.query(
      `update channel_requests
       set status = 'done', site_id = $2, updated_at = now()
       where id = $1`,
      [request.id, site.id],
    );

    await client.query('commit');
    return { slug: site.slug, url: `/site/${site.slug}` };
  } catch (err) {
    await client.query('rollback');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { completeChannelRequest, CompletionError };
