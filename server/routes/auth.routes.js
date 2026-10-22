const express = require('express');
const { logger } = require('../config/logger');
const { env } = require('../config/env');
const { upsertOAuthUser } = require('../repositories/auth.repository');
const { normalizeReturnTo } = require('../utils/auth-redirect');
const { isEmailAuthConfigured } = require('../services/auth-providers.service');
const {
  EmailAuthError,
  hashRequestIp,
  normalizeEmail,
  requestEmailLoginCode,
  verifyEmailLoginCode,
} = require('../services/email-auth.service');
const {
  clearStateCookie,
  createRandomToken,
  createStateCookie,
  endSession,
  readStateCookie,
  startSession,
} = require('../services/auth.service');
const {
  buildAuthorizationUrl,
  createVkPkce,
  exchangeCodeForToken,
  fetchUserInfo,
  normalizeProviderProfile,
} = require('../services/oauth.service');

const authRouter = express.Router();

function redirectToFailure(res, returnTo) {
  const url = new URL(env.authFailureRedirectUrl);
  url.searchParams.set('returnTo', normalizeReturnTo(returnTo));
  return res.redirect(url.toString());
}

function redirectToFrontend(res, returnTo) {
  return res.redirect(new URL(normalizeReturnTo(returnTo), env.frontendOrigin).toString());
}

function startOAuth(provider) {
  return (req, res, next) => {
    try {
      const state = createRandomToken();
      const returnTo = normalizeReturnTo(req.query.returnTo);
      const context = provider === 'vk' ? createVkPkce() : {};
      const authorizationUrl = buildAuthorizationUrl(provider, state, context);

      res.setHeader('Set-Cookie', createStateCookie(state, returnTo, context));
      logger.info({ provider }, 'oauth started');
      return res.redirect(authorizationUrl);
    } catch (err) {
      logger.error({ err, provider }, 'oauth start failed');
      return redirectToFailure(res, req.query.returnTo);
    }
  };
}

function completeOAuth(provider) {
  return async (req, res, next) => {
    let oauthState = { state: '', returnTo: '' };

    try {
      const code = String(req.query.code || '');
      const state = String(req.query.state || '');
      const deviceId = String(req.query.device_id || '');
      oauthState = readStateCookie(req);

      res.setHeader('Set-Cookie', clearStateCookie());

      if (!code || !state || !oauthState.state || state !== oauthState.state) {
        logger.warn({ provider }, 'oauth state validation failed');
        return redirectToFailure(res, oauthState.returnTo);
      }

      const token = await exchangeCodeForToken(provider, code, {
        codeVerifier: oauthState.codeVerifier,
        deviceId,
        state,
      });
      const rawProfile = await fetchUserInfo(provider, token);
      const profile = normalizeProviderProfile(provider, rawProfile);

      if (!profile.providerAccountId) {
        logger.warn({ provider }, 'oauth profile missing provider account id');
        return redirectToFailure(res, oauthState.returnTo);
      }

      const user = await upsertOAuthUser(profile);
      await startSession(res, user);

      logger.info({ provider, userId: user.id }, 'oauth completed');
      return redirectToFrontend(res, oauthState.returnTo);
    } catch (err) {
      logger.error({ err, provider }, 'oauth failed');
      return redirectToFailure(res, oauthState?.returnTo);
    }
  };
}

authRouter.get('/yandex', startOAuth('yandex'));
authRouter.get('/yandex/callback', completeOAuth('yandex'));
authRouter.get('/google', startOAuth('google'));
authRouter.get('/google/callback', completeOAuth('google'));
authRouter.get('/vk', startOAuth('vk'));
authRouter.get('/vk/callback', completeOAuth('vk'));

function requireEmailAuth(req, res, next) {
  res.setHeader('Cache-Control', 'no-store');
  if (!isEmailAuthConfigured()) {
    logger.warn({ reason: 'not_configured' }, 'email login request rejected');
    return res.status(503).json({ error: 'EMAIL_AUTH_NOT_CONFIGURED' });
  }
  const origin = req.get('origin');
  if ((origin && origin !== new URL(env.frontendOrigin).origin) || !req.is('application/json')) {
    logger.warn({ reason: 'origin_or_content_type' }, 'email login request rejected');
    return res.status(403).json({ error: 'EMAIL_AUTH_REQUEST_REJECTED' });
  }
  return next();
}

function getRequestIp(req) {
  const address = req.socket?.remoteAddress || '';
  const localProxy = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(address);
  // Nginx is the trusted local proxy. Do not trust a caller-supplied leftmost X-Forwarded-For.
  return (localProxy ? req.get('x-forwarded-for')?.split(',').at(-1)?.trim() : '') || address || 'unknown';
}

function emailAuthFailure(res, err, next) {
  if (!(err instanceof EmailAuthError)) return next(err);
  logger.warn({ code: err.code, status: err.status }, 'email login failed');
  if (err.retryAfterSeconds) res.setHeader('Retry-After', String(err.retryAfterSeconds));
  return res.status(err.status).json({
    error: err.code,
    ...(err.retryAfterSeconds ? { retryAfterSeconds: err.retryAfterSeconds } : {}),
  });
}

authRouter.post('/email/request', requireEmailAuth, async (req, res, next) => {
  logger.info('email login request received');
  const email = normalizeEmail(req.body?.email);
  if (!email) return res.status(400).json({ error: 'INVALID_EMAIL' });
  try {
    const result = await requestEmailLoginCode({ email, ipHash: hashRequestIp(getRequestIp(req)) });
    return res.json({ ok: true, ...result });
  } catch (err) {
    return emailAuthFailure(res, err, next);
  }
});

authRouter.post('/email/verify', requireEmailAuth, async (req, res, next) => {
  const email = normalizeEmail(req.body?.email);
  const code = req.body?.code;
  if (!email || typeof code !== 'string' || !/^\d{6}$/.test(code)) {
    return res.status(400).json({ error: 'EMAIL_AUTH_CODE_INVALID' });
  }
  try {
    const user = await verifyEmailLoginCode({ email, code });
    await startSession(res, user);
    logger.info({ userId: user.id }, 'email login completed');
    return res.json({ ok: true, returnTo: normalizeReturnTo(req.body?.returnTo) });
  } catch (err) {
    return emailAuthFailure(res, err, next);
  }
});

authRouter.post('/logout', async (req, res, next) => {
  try {
    await endSession(req, res);
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

module.exports = { authRouter };
