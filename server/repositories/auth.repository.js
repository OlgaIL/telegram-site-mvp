const { pool, query } = require('../db');

async function upsertOAuthUser({ provider, providerAccountId, email, name, avatarUrl, profile }) {
  const client = await pool.connect();

  try {
    await client.query('begin');

    const existingAccount = await client.query(
      `
        select u.id, u.email, u.name, u.avatar_url, u.created_at, u.updated_at
        from auth_accounts a
        join users u on u.id = a.user_id
        where a.provider = $1 and a.provider_account_id = $2
        limit 1;
      `,
      [provider, providerAccountId],
    );

    let user = existingAccount.rows[0] || null;

    if (!user && email) {
      const existingUser = await client.query(
        `
          select id, email, name, avatar_url, created_at, updated_at
          from users
          where lower(email) = lower($1)
          limit 1;
        `,
        [email],
      );
      user = existingUser.rows[0] || null;
    }

    if (!user) {
      const insertedUser = await client.query(
        `
          insert into users (email, name, avatar_url)
          values ($1, $2, $3)
          returning id, email, name, avatar_url, created_at, updated_at;
        `,
        [email || null, name || null, avatarUrl || null],
      );
      user = insertedUser.rows[0];
    } else {
      const updatedUser = await client.query(
        `
          update users
          set
            email = coalesce($2, email),
            name = coalesce($3, name),
            avatar_url = coalesce($4, avatar_url),
            updated_at = now()
          where id = $1
          returning id, email, name, avatar_url, created_at, updated_at;
        `,
        [user.id, email || null, name || null, avatarUrl || null],
      );
      user = updatedUser.rows[0];
    }

    await client.query(
      `
        insert into auth_accounts (user_id, provider, provider_account_id, email, profile_json)
        values ($1, $2, $3, $4, $5::jsonb)
        on conflict (provider, provider_account_id)
        do update set
          user_id = excluded.user_id,
          email = excluded.email,
          profile_json = excluded.profile_json,
          updated_at = now();
      `,
      [user.id, provider, providerAccountId, email || null, JSON.stringify(profile || {})],
    );

    await client.query('commit');
    return user;
  } catch (err) {
    await client.query('rollback');
    throw err;
  } finally {
    client.release();
  }
}

async function createSession({ userId, tokenHash, expiresAt }) {
  const result = await query(
    `
      insert into sessions (user_id, token_hash, expires_at)
      values ($1, $2, $3)
      returning id, user_id, expires_at, created_at, last_seen_at;
    `,
    [userId, tokenHash, expiresAt],
  );

  return result.rows[0];
}

async function findUserBySessionTokenHash(tokenHash) {
  const result = await query(
    `
      select
        u.id,
        u.email,
        u.name,
        u.avatar_url,
        u.created_at,
        u.updated_at,
        s.id as session_id,
        s.expires_at as session_expires_at
      from sessions s
      join users u on u.id = s.user_id
      where s.token_hash = $1
        and s.expires_at > now()
      limit 1;
    `,
    [tokenHash],
  );

  if (result.rows[0]) {
    await query('update sessions set last_seen_at = now() where id = $1', [result.rows[0].session_id]);
  }

  return result.rows[0] || null;
}

async function deleteSessionByTokenHash(tokenHash) {
  await query('delete from sessions where token_hash = $1', [tokenHash]);
}

module.exports = {
  createSession,
  deleteSessionByTokenHash,
  findUserBySessionTokenHash,
  upsertOAuthUser,
};
