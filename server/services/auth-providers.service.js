const { env } = require('../config/env');
const { getAvailableProviders: getOAuthProviders } = require('./oauth.service');

function isEmailAuthConfigured() {
  return Boolean(
    env.emailAuthEnabled &&
    env.emailOtpSecret.length >= 32 &&
    env.smtpHost &&
    env.smtpUser &&
    env.smtpPassword &&
    env.smtpFrom
  );
}

function getAvailableProviders() {
  const items = getOAuthProviders();
  if (isEmailAuthConfigured()) {
    items.push({ id: 'email', label: 'Почта' });
  }
  return items;
}

module.exports = { getAvailableProviders, isEmailAuthConfigured };
