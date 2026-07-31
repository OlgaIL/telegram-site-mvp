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
  exchangeCodeForToken,
  fetchUserInfo,
  normalizeProviderProfile,
} = require('../services/oauth.service');

const authRouter = express.Router();

function redirectToFailure(res) {
  return res.redirect(env.authFailureRedirectUrl);
}

function redirectToFrontendHome(res) {
  return res.redirect(new URL('/', env.frontendOrigin).toString());
}

function startOAuth(provider) {
  return (req, res, next) => {
    try {
      const state = createRandomToken();
      const authorizationUrl = buildAuthorizationUrl(provider, state);

      res.setHeader('Set-Cookie', createStateCookie(state));
      logger.info({ provider }, 'oauth started');
      return res.redirect(authorizationUrl);
    } catch (err) {
      logger.error({ err, provider }, 'oauth start failed');
      return redirectToFailure(res);
    }
  };
}

function completeOAuth(provider) {
  return async (req, res, next) => {
    try {
      const code = String(req.query.code || '');
      const state = String(req.query.state || '');
      const expectedState = readStateCookie(req);

      res.setHeader('Set-Cookie', clearStateCookie());

      if (!code || !state || !expectedState || state !== expectedState) {
        logger.warn({ provider }, 'oauth state validation failed');
        return redirectToFailure(res);
      }

      const token = await exchangeCodeForToken(provider, code);
      const rawProfile = await fetchUserInfo(provider, token.access_token);
      const profile = normalizeProviderProfile(provider, rawProfile);

      if (!profile.providerAccountId) {
        logger.warn({ provider }, 'oauth profile missing provider account id');
        return redirectToFailure(res);
      }

      const user = await upsertOAuthUser(profile);
      await startSession(res, user);

      logger.info({ provider, userId: user.id }, 'oauth completed');
      return redirectToFrontendHome(res);
    } catch (err) {
      logger.error({ err, provider }, 'oauth failed');
      return redirectToFailure(res);
    }
  };
}

authRouter.get('/yandex', startOAuth('yandex'));
authRouter.get('/yandex/callback', completeOAuth('yandex'));
authRouter.get('/google', startOAuth('google'));
authRouter.get('/google/callback', completeOAuth('google'));

authRouter.post('/logout', async (req, res, next) => {
  try {
    await endSession(req, res);
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

module.exports = { authRouter };
