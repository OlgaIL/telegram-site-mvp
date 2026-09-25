const { pool } = require('../server/db');

function readOption(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? '' : String(process.argv[index + 1] || '').trim();
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}

function validateInput({ requestId, telegramChatId, slug }) {
  if (!/^[1-9]\d*$/.test(requestId)) {
    return 'Pass a positive --request-id.';
  }

  if (!/^-?\d+$/.test(telegramChatId)) {
    return 'Pass the discovered numeric --telegram-chat-id.';
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return 'Pass a unique lowercase --slug using letters, numbers, and hyphens.';
  }

  return null;
}

async function run() {
  const input = {
    requestId: readOption('request-id'),
    telegramChatId: readOption('telegram-chat-id'),
    slug: readOption('slug'),
  };
  const validationError = validateInput(input);

  if (validationError) {
    fail(validationError);
    return;
  }

  const client = await pool.connect();

  try {
    await client.query('begin');

    const requestResult = await client.query(
      'select id, status, site_id from channel_requests where id = $1 for update',
      [input.requestId],
    );
    const request = requestResult.rows[0];

    if (!request) {
      throw new Error('Channel request was not found.');
    }

    if (request.site_id) {
      throw new Error('Channel request is already linked to a site.');
    }

    const channelResult = await client.query(
      'select id, title, username from channels where telegram_chat_id = $1 for update',
      [input.telegramChatId],
    );
    const channel = channelResult.rows[0];

    if (!channel) {
      throw new Error('Discovered Telegram channel was not found in the database.');
    }

    const existingSite = await client.query('select id from sites where channel_id = $1 limit 1', [channel.id]);

    if (existingSite.rows[0]) {
      throw new Error('This Telegram channel is already linked to a site.');
    }

    const title = channel.title || channel.username || input.slug;
    const siteResult = await client.query(
      `
        insert into sites (channel_id, name, slug, title, description, updated_at)
        values ($1, $2, $3, $4, $5, now())
        returning id, slug;
      `,
      [channel.id, title, input.slug, title, 'Telegram-powered updates'],
    );
    const site = siteResult.rows[0];

    await client.query(
      `
        update channel_requests
        set status = 'done', site_id = $2, updated_at = now()
        where id = $1;
      `,
      [request.id, site.id],
    );

    await client.query('commit');
    process.stdout.write(`Done: /site/${site.slug}\n`);
  } catch (err) {
    await client.query('rollback');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  fail(err.message || 'Could not complete the channel request.');
});
