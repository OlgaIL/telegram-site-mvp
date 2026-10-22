const crypto = require('node:crypto');
const { pool, query } = require('../db');
const { env } = require('../config/env');
const { logger } = require('../config/logger');
const { sendEmailLoginCode } = require('./email-delivery.service');

class EmailAuthError extends Error {
  constructor(code, status = 400, retryAfterSeconds = null) {
    super(code);
    this.code = code;
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function normalizeEmail(value) {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  return email.length <= 320 && /^[^\s@<>,;:"]+@[^\s@<>,;:"]+\.[^\s@<>,;:"]+$/.test(email) ? email : null;
}

function digest(value) {
  if (env.emailOtpSecret.length < 32) {
    throw new EmailAuthError('EMAIL_AUTH_NOT_CONFIGURED', 503);
  }
  return crypto.createHmac('sha256', env.emailOtpSecret).update(value).digest('hex');
}

function hashRequestIp(ip) {
  return digest('ip:' + (ip || 'unknown'));
}

function codeHash(email, code) {
  return digest('code:' + email + ':' + code);
}

async function transaction(work) {
  const client = await pool.connect();
  try {
    await client.query('begin');
    const result = await work(client);
    await client.query('commit');
    return result;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

async function requestEmailLoginCode({ email, ipHash, sendCode = sendEmailLoginCode }) {
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  const hash = codeHash(email, code);
  const ttlMinutes = env.emailAuthCodeTtlMinutes;
  const resendSeconds = env.emailAuthResendSeconds;

  const record = await transaction(async (client) => {
    // Serialize both limits, including simultaneous requests to different emails from one IP.
    await client.query('select pg_advisory_xact_lock(hashtext($1))', ['email-auth-ip:' + ipHash]);
    await client.query('select pg_advisory_xact_lock(hashtext($1))', ['email-auth:' + email]);
    const { rows: [rate] } = await client.query(
      `select
         count(*) filter (where email_normalized = $1)::int as email_requests,
         count(*) filter (where request_ip_hash = $2)::int as ip_requests,
         max(created_at) filter (where email_normalized = $1) as last_email_request
       from email_login_codes
       where created_at > now() - interval '1 hour'`,
      [email, ipHash],
    );
    const elapsed = rate.last_email_request
      ? Math.floor((Date.now() - new Date(rate.last_email_request).getTime()) / 1000)
      : resendSeconds;
    if (elapsed < resendSeconds) {
      throw new EmailAuthError('EMAIL_AUTH_RATE_LIMITED', 429, resendSeconds - elapsed);
    }
    if (rate.email_requests >= env.emailAuthEmailRequestsPerHour ||
        rate.ip_requests >= env.emailAuthIpRequestsPerHour) {
      throw new EmailAuthError('EMAIL_AUTH_RATE_LIMITED', 429, 3600);
    }
    await client.query(
      'update email_login_codes set consumed_at = now() where email_normalized = $1 and consumed_at is null',
      [email],
    );
    const { rows } = await client.query(
      `insert into email_login_codes
         (email_normalized, code_hash, request_ip_hash, expires_at, attempts_remaining)
       values ($1, $2, $3, now() + ($4 * interval '1 minute'), $5)
       returning id`,
      [email, hash, ipHash, ttlMinutes, env.emailAuthMaxAttempts],
    );
    return rows[0];
  });

  try {
    await sendCode({ email, code, ttlMinutes });
  } catch (error) {
    await query('update email_login_codes set consumed_at = now() where id = $1', [record.id]);
    logger.warn({
      codeId: record.id,
      smtpCode: error.code,
      smtpResponseCode: error.responseCode,
      smtpCommand: error.command,
    }, 'email login delivery failed');
    throw new EmailAuthError('EMAIL_AUTH_DELIVERY_FAILED', 503);
  }
  logger.info({ codeId: record.id }, 'email login code sent');
  query("delete from email_login_codes where created_at < now() - interval '2 days'")
    .catch(() => logger.warn('email login cleanup failed'));
  return { retryAfterSeconds: resendSeconds };
}

async function verifyEmailLoginCode({ email, code }) {
  const hash = codeHash(email, code);
  const result = await transaction(async (client) => {
    await client.query('select pg_advisory_xact_lock(hashtext($1))', ['email-auth:' + email]);
    const { rows: [record] } = await client.query(
      `select * from email_login_codes
       where email_normalized = $1 and consumed_at is null
       order by created_at desc limit 1 for update`,
      [email],
    );
    if (!record || new Date(record.expires_at).getTime() <= Date.now() || record.attempts_remaining <= 0) {
      return { invalid: true };
    }
    const expected = Buffer.from(record.code_hash);
    const submitted = Buffer.from(hash);
    if (expected.length !== submitted.length || !crypto.timingSafeEqual(expected, submitted)) {
      // Commit failed attempts; throwing inside this transaction would roll them back.
      await client.query(
        `update email_login_codes
         set attempts_remaining = greatest(attempts_remaining - 1, 0),
             consumed_at = case when attempts_remaining <= 1 then now() else consumed_at end
         where id = $1`,
        [record.id],
      );
      return { invalid: true };
    }
    const { rows: [user] } = await client.query(
      `insert into users (email, name, email_verified_at)
       values ($1, $2, now())
       on conflict (lower(email)) where email is not null and email <> ''
       do update set email_verified_at = coalesce(users.email_verified_at, now()), updated_at = now()
       returning id, email, name, avatar_url, created_at, updated_at`,
      [email, email.split('@')[0].slice(0, 120)],
    );
    await client.query(
      'update email_login_codes set consumed_at = now() where email_normalized = $1 and consumed_at is null',
      [email],
    );
    return { user };
  });
  if (result.invalid) throw new EmailAuthError('EMAIL_AUTH_CODE_INVALID');
  return result.user;
}

module.exports = { EmailAuthError, hashRequestIp, normalizeEmail, requestEmailLoginCode, verifyEmailLoginCode };
