const express = require('express');
const { logger } = require('../config/logger');
const { env } = require('../config/env');
const { upsertOAuthUser } = require('../repositories/auth.repository');
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

function normalizeReturnTo(value) {
  const returnTo = String(value || '');

  if (!returnTo.startsWith('/') || returnTo.startsWith('//') || returnTo.includes('\\')) {
    return '/dashboard';
  }

  return returnTo;
}

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

authRouter.post('/logout', async (req, res, next) => {
  try {
    await endSession(req, res);
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

module.exports = { authRouter };
