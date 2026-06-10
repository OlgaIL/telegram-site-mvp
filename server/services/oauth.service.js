const { env } = require('../config/env');

const providers = {
  yandex: {
    authorizationUrl: 'https://oauth.yandex.ru/authorize',
    tokenUrl: 'https://oauth.yandex.ru/token',
    userInfoUrl: 'https://login.yandex.ru/info?format=json',
    clientId: env.yandexClientId,
    clientSecret: env.yandexClientSecret,
    callbackUrl: env.yandexCallbackUrl,
    scope: '',
  },
  google: {
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
    clientId: env.googleClientId,
    clientSecret: env.googleClientSecret,
    callbackUrl: env.googleCallbackUrl,
    scope: 'openid email profile',
  },
};

function getProviderConfig(provider) {
  const config = providers[provider];

  if (!config) {
    throw new Error(`Unsupported OAuth provider: ${provider}`);
  }

  return config;
}

function assertProviderConfigured(provider, config) {
  if (!config.clientId || !config.clientSecret || !config.callbackUrl) {
    throw new Error(`${provider} OAuth is not configured`);
  }
}

function buildAuthorizationUrl(provider, state) {
  const config = getProviderConfig(provider);
  assertProviderConfigured(provider, config);

  const url = new URL(config.authorizationUrl);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', config.clientId);
  url.searchParams.set('redirect_uri', config.callbackUrl);
  url.searchParams.set('state', state);

  if (config.scope) {
    url.searchParams.set('scope', config.scope);
  }

  if (provider === 'google') {
    url.searchParams.set('access_type', 'offline');
    url.searchParams.set('prompt', 'select_account');
  }

  return url.toString();
}

async function exchangeCodeForToken(provider, code) {
  const config = getProviderConfig(provider);
  assertProviderConfigured(provider, config);

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.callbackUrl,
  });

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || !payload.access_token) {
    throw new Error(`${provider} token exchange failed`);
  }

  return payload;
}

async function fetchUserInfo(provider, accessToken) {
  const config = getProviderConfig(provider);
  const scheme = provider === 'yandex' ? 'OAuth' : 'Bearer';

  const response = await fetch(config.userInfoUrl, {
    headers: {
      authorization: `${scheme} ${accessToken}`,
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`${provider} user info failed`);
  }

  return payload;
}

function normalizeProviderProfile(provider, profile) {
  if (provider === 'yandex') {
    const avatarId = profile.default_avatar_id;

    return {
      provider,
      providerAccountId: String(profile.id || ''),
      email: profile.default_email || profile.emails?.[0] || null,
      name: profile.real_name || profile.display_name || profile.login || null,
      avatarUrl: avatarId ? `https://avatars.yandex.net/get-yapic/${avatarId}/islands-200` : null,
      profile,
    };
  }

  return {
    provider,
    providerAccountId: String(profile.sub || ''),
    email: profile.email || null,
    name: profile.name || null,
    avatarUrl: profile.picture || null,
    profile,
  };
}

module.exports = {
  buildAuthorizationUrl,
  exchangeCodeForToken,
  fetchUserInfo,
  normalizeProviderProfile,
};
