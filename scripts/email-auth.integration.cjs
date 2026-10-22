const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { once } = require('node:events');
const { before, after, test } = require('node:test');

process.env.NODE_ENV = 'test';
process.env.DOTENV_CONFIG_QUIET = 'true';
const { env } = require('../server/config/env');
const hostname = new URL(env.databaseUrl).hostname;
if (!['localhost', '127.0.0.1', '[::1]'].includes(hostname)) {
  throw new Error('Auth integration tests require a local PostgreSQL database.');
}
Object.assign(env, {
  googleAuthEnabled: false,
  yandexAuthEnabled: false,
  vkAuthEnabled: false,
  emailAuthEnabled: true,
  emailOtpSecret: crypto.randomBytes(32).toString('hex'),
  emailAuthCodeTtlMinutes: 10,
  emailAuthResendSeconds: 60,
  emailAuthMaxAttempts: 5,
  emailAuthEmailRequestsPerHour: 5,
  emailAuthIpRequestsPerHour: 20,
  smtpHost: 'smtp.example.test',
  smtpUser: 'test@example.test',
  smtpPassword: 'test-only',
  smtpFrom: 'test@example.test',
});

const { Pool } = require('pg');
const { pool, query } = require('../server/db');
const schema = 'auth_test_' + crypto.randomUUID().replaceAll('-', '');
const admin = new Pool({ ...pool.options, connectionTimeoutMillis: 5000 });
pool.options.options = '-c search_path=' + schema;
pool.options.connectionTimeoutMillis = 5000;
const delivered = new Map();
const delivery = require('../server/services/email-delivery.service');
delivery.sendEmailLoginCode = async ({ email, code }) => { delivered.set(email, code); };
const {
  EmailAuthError, hashRequestIp, normalizeEmail, requestEmailLoginCode, verifyEmailLoginCode,
} = require('../server/services/email-auth.service');
const { app } = require('../server/app');
let server;
let baseUrl;
let createdSchema = false;

before(async () => {
  await admin.query('create schema ' + schema);
  createdSchema = true;
  for (const filename of ['006_create_auth_tables.sql', '009_email_passwordless_auth.sql']) {
    const sql = await fs.readFile(path.join(__dirname, '../server/db/migrations', filename), 'utf8');
    await query(sql);
  }
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  baseUrl = 'http://127.0.0.1:' + server.address().port;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await pool.end();
  if (createdSchema) await admin.query('drop schema ' + schema + ' cascade');
  await admin.end();
});

async function requestCode(email, overrides = {}) {
  await requestEmailLoginCode({ email, ipHash: hashRequestIp('test:' + email), ...overrides });
  return delivered.get(email);
}

async function post(route, body, headers = {}) {
  return fetch(baseUrl + route, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: env.frontendOrigin, ...headers },
    body: JSON.stringify(body),
  });
}

function invalidCode(error) {
  return error instanceof EmailAuthError && error.code === 'EMAIL_AUTH_CODE_INVALID';
}

test('normalizes email and rejects mailbox/header injection', () => {
  assert.equal(normalizeEmail(' User@Example.test '), 'user@example.test');
  for (const value of [null, {}, 'Name <user@example.test>', 'a@example.test,b@example.test', 'user@example.test\nBcc:x@example.test']) {
    assert.equal(normalizeEmail(value), null);
  }
});

test('creates a user and consumes the code exactly once, storing only a digest', async () => {
  const email = 'new@example.test';
  const code = await requestCode(email);
  assert.match(code, /^\d{6}$/);
  const { rows: [record] } = await query('select * from email_login_codes where email_normalized = $1', [email]);
  assert.notEqual(record.code_hash, code);
  assert.match(record.code_hash, /^[a-f0-9]{64}$/);
  assert.match(record.request_ip_hash, /^[a-f0-9]{64}$/);
  const user = await verifyEmailLoginCode({ email, code });
  assert.equal(user.email, email);
  await assert.rejects(() => verifyEmailLoginCode({ email, code }), invalidCode);
});

test('preserves an existing OAuth user, profile and linked account', async () => {
  const email = 'oauth@example.test';
  const { rows: [original] } = await query(
    'insert into users (email, name, avatar_url) values ($1, $2, $3) returning *',
    [email, 'Original Name', '/original-avatar.png'],
  );
  await query(
    'insert into auth_accounts (user_id, provider, provider_account_id) values ($1, $2, $3)',
    [original.id, 'google', 'oauth-example'],
  );
  const user = await verifyEmailLoginCode({ email, code: await requestCode(email) });
  assert.equal(user.id, original.id);
  assert.equal(user.name, original.name);
  assert.equal(user.avatar_url, original.avatar_url);
  const { rows: [account] } = await query('select user_id from auth_accounts where user_id = $1', [original.id]);
  assert.equal(account.user_id, original.id);
});

test('rejects expired codes and commits failed attempt counters', async () => {
  const email = 'attempts@example.test';
  const code = await requestCode(email);
  const wrong = code === '000000' ? '111111' : '000000';
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await assert.rejects(() => verifyEmailLoginCode({ email, code: wrong }), invalidCode);
  }
  await assert.rejects(() => verifyEmailLoginCode({ email, code }), invalidCode);
  const { rows: [record] } = await query('select attempts_remaining from email_login_codes where email_normalized = $1', [email]);
  assert.equal(record.attempts_remaining, 0);
  const expired = 'expired@example.test';
  const oldCode = await requestCode(expired);
  await query("update email_login_codes set expires_at = now() - interval '1 minute' where email_normalized = $1", [expired]);
  await assert.rejects(() => verifyEmailLoginCode({ email: expired, code: oldCode }), invalidCode);
});

test('resend invalidates previous codes and respects cooldown', async (t) => {
  let next = 123456;
  t.mock.method(crypto, 'randomInt', () => next++);
  const email = 'resend@example.test';
  const oldCode = await requestCode(email);
  await assert.rejects(() => requestCode(email), (err) => err.status === 429 && err.retryAfterSeconds > 0);
  await query("update email_login_codes set created_at = now() - interval '2 minutes' where email_normalized = $1", [email]);
  const code = await requestCode(email);
  await assert.rejects(() => verifyEmailLoginCode({ email, code: oldCode }), invalidCode);
  assert.equal((await verifyEmailLoginCode({ email, code })).email, email);
});

test('failed delivery invalidates the saved code and returns a recoverable error', async () => {
  const email = 'delivery-failed@example.test';
  await assert.rejects(
    () => requestCode(email, { sendCode: async () => { throw new Error('SMTP rejected'); } }),
    (err) => err.code === 'EMAIL_AUTH_DELIVERY_FAILED' && err.status === 503,
  );
  const { rows: [record] } = await query('select consumed_at from email_login_codes where email_normalized = $1', [email]);
  assert.ok(record.consumed_at);
});

test('serializes IP limits across simultaneous requests to different mailboxes', async () => {
  const previous = env.emailAuthIpRequestsPerHour;
  env.emailAuthIpRequestsPerHour = 1;
  try {
    const ipHash = hashRequestIp('same-test-ip');
    const results = await Promise.allSettled([
      requestCode('parallel-a@example.test', { ipHash }),
      requestCode('parallel-b@example.test', { ipHash }),
    ]);
    assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
    assert.equal(results.find((result) => result.status === 'rejected').reason.status, 429);
  } finally {
    env.emailAuthIpRequestsPerHour = previous;
  }
});

test('HTTP flow sets a working session cookie and returns to add-channel', async () => {
  const email = 'http@example.test';
  assert.equal((await post('/auth/email/request', { email })).status, 200);
  const result = await post('/auth/email/verify', { email, code: delivered.get(email), returnTo: '/add-channel' });
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), { ok: true, returnTo: '/add-channel' });
  const cookie = result.headers.getSetCookie().find((value) => value.startsWith(env.sessionCookieName + '='));
  assert.match(cookie, /HttpOnly/);
  const me = await fetch(baseUrl + '/api/me', { headers: { cookie: cookie.split(';')[0] } });
  const payload = await me.json();
  assert.equal(payload.authenticated, true);
  assert.equal(payload.user.email, email);
  const second = await post('/auth/email/verify', { email, code: delivered.get(email) });
  assert.equal(second.status, 400);
});

test('HTTP rejects cross-origin requests, malformed codes and external redirects', async () => {
  assert.equal((await post('/auth/email/request', { email: 'x@example.test' }, { origin: 'https://evil.test' })).status, 403);
  assert.equal((await post('/auth/email/request', { email: 'bad-address' })).status, 400);
  assert.equal((await post('/auth/email/verify', { email: 'x@example.test', code: '1a2b3c' })).status, 400);
  const email = 'redirect@example.test';
  await post('/auth/email/request', { email });
  const result = await post('/auth/email/verify', { email, code: delivered.get(email), returnTo: '//evil.test' });
  assert.equal((await result.json()).returnTo, '/dashboard');
});

test('disabling email removes it from the provider list and blocks both endpoints', async () => {
  env.emailAuthEnabled = false;
  try {
    const providers = await (await fetch(baseUrl + '/api/auth-providers')).json();
    assert.ok(!providers.items.some((provider) => provider.id === 'email'));
    assert.equal((await post('/auth/email/request', { email: 'x@example.test' })).status, 503);
    assert.equal((await post('/auth/email/verify', { email: 'x@example.test', code: '123456' })).status, 503);
  } finally {
    env.emailAuthEnabled = true;
  }
});

test('disabled OAuth providers reject direct start and callback routes', async () => {
  const { createStateCookie } = require('../server/services/auth.service');
  for (const provider of ['google', 'yandex', 'vk']) {
    const start = await fetch(baseUrl + '/auth/' + provider + '?returnTo=%2Fadd-channel', { redirect: 'manual' });
    assert.equal(start.status, 302);
    assert.equal(new URL(start.headers.get('location')).pathname, '/login');
    assert.equal(new URL(start.headers.get('location')).searchParams.get('returnTo'), '/add-channel');
    const callback = await fetch(baseUrl + '/auth/' + provider + '/callback?code=test&state=test&device_id=test', {
      redirect: 'manual',
      headers: { cookie: createStateCookie('test', '/dashboard', { codeVerifier: 'test' }).split(';')[0] },
    });
    assert.equal(callback.status, 302);
    assert.equal(new URL(callback.headers.get('location')).pathname, '/login');
    assert.ok(!callback.headers.getSetCookie().some((cookie) => cookie.startsWith(env.sessionCookieName + '=')));
  }
});
