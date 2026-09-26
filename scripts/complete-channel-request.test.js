const assert = require('node:assert/strict');
const test = require('node:test');
const { pool } = require('../server/db');
const { completeChannelRequest, CompletionError } = require('../server/services/complete-channel-request.service');

test('creates a unique site and completes the request in one transaction', async () => {
  const originalConnect = pool.connect;
  const statements = [];
  let insertCount = 0;

  pool.connect = async () => ({
    async query(sql, params = []) {
      statements.push({ sql, params });

      if (sql.includes('from channel_requests where id')) {
        return { rows: [{ id: '12', status: 'new', site_id: null }] };
      }
      if (sql.includes('from channels where id')) {
        return { rows: [{ id: '7', title: 'Test channel', username: 'test_channel' }] };
      }
      if (sql.includes('from posts where channel_id')) {
        return { rows: [{ found: 1 }] };
      }
      if (sql.includes('from sites where channel_id')) {
        return { rows: [] };
      }
      if (sql.includes('insert into sites')) {
        insertCount += 1;
        return insertCount === 1
          ? { rows: [] }
          : { rows: [{ id: '22', slug: 'channel-7-12-2' }] };
      }

      return { rows: [] };
    },
    release() {},
  });

  try {
    const result = await completeChannelRequest({ requestId: '12', channelId: '7' });
    assert.deepEqual(result, { slug: 'channel-7-12-2', url: '/site/channel-7-12-2' });
    assert.equal(insertCount, 2);
    assert.equal(statements.at(-1).sql, 'commit');
    assert.ok(statements.some(({ sql }) => sql.includes("set status = 'done'")));
  } finally {
    pool.connect = originalConnect;
  }
});

test('does not create another site for a completed request', async () => {
  const originalConnect = pool.connect;
  const statements = [];

  pool.connect = async () => ({
    async query(sql) {
      statements.push(sql);
      if (sql.includes('from channel_requests where id')) {
        return { rows: [{ id: '12', status: 'done', site_id: '22' }] };
      }
      return { rows: [] };
    },
    release() {},
  });

  try {
    await assert.rejects(
      completeChannelRequest({ requestId: '12', channelId: '7' }),
      CompletionError,
    );
    assert.ok(statements.includes('rollback'));
    assert.ok(!statements.some((sql) => sql.includes('insert into sites')));
  } finally {
    pool.connect = originalConnect;
  }
});
