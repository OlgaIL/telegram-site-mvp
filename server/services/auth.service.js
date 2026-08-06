const crypto = require('crypto');
const { env } = require('../config/env');
const {
  createSession,
  deleteSessionByTokenHash,
  findUserBySessionTokenHash,
} = require('../repositories/auth.repository');
const { parseCookies, serializeCookie } = require('../utils/cookies');

const STATE_COOKIE_NAME = 'telegram_site_oauth_state';

function createRandomToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function isProduction() {
  return env.nodeEnv === 'production';
}

function createStateCookie(state, returnTo) {
  return serializeCookie(STATE_COOKIE_NAME, JSON.stringify({ state, returnTo }), {
    httpOnly: true,
    maxAge: 10 * 60,
    sameSite: 'Lax',
    secure: isProduction(),
  });
}

function clearStateCookie() {
  return serializeCookie(STATE_COOKIE_NAME, '', {
    httpOnly: true,
    maxAge: 0,
    sameSite: 'Lax',
    secure: isProduction(),
  });
}

function appendSetCookie(res, cookie) {
  const current = res.getHeader('Set-Cookie');

  if (!current) {
    res.setHeader('Set-Cookie', cookie);
    return;
  }

  res.setHeader('Set-Cookie', Array.isArray(current) ? [...current, cookie] : [current, cookie]);
}

function readStateCookie(req) {
  const value = parseCookies(req.headers.cookie)[STATE_COOKIE_NAME];

  if (!value) {
    return { state: '', returnTo: '' };
  }

  try {
    const payload = JSON.parse(value);
    return {
      state: String(payload.state || ''),
      returnTo: String(payload.returnTo || ''),
    };
  } catch {
    return { state: '', returnTo: '' };
  }
}

async function startSession(res, user) {
  const token = createRandomToken();
  const expiresAt = new Date(Date.now() + env.sessionTtlDays * 24 * 60 * 60 * 1000);

  await createSession({
    userId: user.id,
    tokenHash: hashToken(token),
    expiresAt,
  });

  appendSetCookie(
    res,
    serializeCookie(env.sessionCookieName, token, {
      httpOnly: true,
      expires: expiresAt,
      sameSite: 'Lax',
      secure: isProduction(),
    }),
  );
}

async function getCurrentUser(req) {
  const token = parseCookies(req.headers.cookie)[env.sessionCookieName];

  if (!token) {
    return null;
  }

  return findUserBySessionTokenHash(hashToken(token));
}

async function endSession(req, res) {
  const token = parseCookies(req.headers.cookie)[env.sessionCookieName];

  if (token) {
    await deleteSessionByTokenHash(hashToken(token));
  }

  appendSetCookie(
    res,
    serializeCookie(env.sessionCookieName, '', {
      httpOnly: true,
      maxAge: 0,
      sameSite: 'Lax',
      secure: isProduction(),
    }),
  );
}

module.exports = {
  clearStateCookie,
  createRandomToken,
  createStateCookie,
  endSession,
  getCurrentUser,
  readStateCookie,
  startSession,
};
