const { env } = require('../config/env');
const crypto = require('crypto');

const providers = {
  yandex: {
    label: 'Яндекс',
    enabled: env.yandexAuthEnabled,
    requiresClientSecret: true,
    authorizationUrl: 'https://oauth.yandex.ru/authorize',
    tokenUrl: 'https://oauth.yandex.ru/token',
    userInfoUrl: 'https://login.yandex.ru/info?format=json',
    clientId: env.yandexClientId,
    clientSecret: env.yandexClientSecret,
    callbackUrl: env.yandexCallbackUrl,
    scope: '',
  },
  google: {
    label: 'Google',
    enabled: env.googleAuthEnabled,
    requiresClientSecret: true,
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
    clientId: env.googleClientId,
    clientSecret: env.googleClientSecret,
    callbackUrl: env.googleCallbackUrl,
    scope: 'openid email profile',
  },
  vk: {
    label: 'VK',
    enabled: env.vkAuthEnabled,
    requiresClientSecret: false,
    authorizationUrl: 'https://id.vk.com/authorize',
    tokenUrl: 'https://id.vk.com/oauth2/auth',
    userInfoUrl: 'https://id.vk.com/oauth2/user_info',
    clientId: env.vkClientId,
    clientSecret: env.vkClientSecret,
    callbackUrl: env.vkCallbackUrl,
    scope: 'email',
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
  if (!isProviderConfigured(config)) {
    throw new Error(`${provider} OAuth is not configured`);
  }
}

function isProviderConfigured(config) {
  return Boolean(
    config.enabled &&
      config.clientId &&
      config.callbackUrl &&
      (!config.requiresClientSecret || config.clientSecret),
  );
}

function getAvailableProviders() {
  return Object.entries(providers)
    .filter(([, config]) => isProviderConfigured(config))
    .map(([id, config]) => ({ id, label: config.label }));
}

function createVkPkce() {
  const codeVerifier = crypto.randomBytes(48).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

  return { codeVerifier, codeChallenge };
}

function buildAuthorizationUrl(provider, state, context = {}) {
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

  if (provider === 'vk') {
    if (!context.codeChallenge) {
      throw new Error('VK ID PKCE challenge is required');
    }

    url.searchParams.set('code_challenge', context.codeChallenge);
    url.searchParams.set('code_challenge_method', 'S256');
  }

  return url.toString();
}

async function exchangeCodeForToken(provider, code, context = {}) {
  const config = getProviderConfig(provider);
  assertProviderConfigured(provider, config);

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: config.clientId,
    redirect_uri: config.callbackUrl,
  });

  if (config.requiresClientSecret) {
    body.set('client_secret', config.clientSecret);
  }

  if (provider === 'vk') {
    if (!context.codeVerifier || !context.deviceId) {
      throw new Error('VK ID callback is missing PKCE data');
    }

    body.set('code_verifier', context.codeVerifier);
    body.set('device_id', context.deviceId);
  }

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

async function fetchUserInfo(provider, token) {
  const config = getProviderConfig(provider);
  const accessToken = token.access_token;

  if (provider === 'vk') {
    const response = await fetch(config.userInfoUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        access_token: accessToken,
      }),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok || !payload.user?.user_id) {
      throw new Error('vk user info failed');
    }

    return payload.user;
  }

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

  if (provider === 'vk') {
    return {
      provider,
      providerAccountId: String(profile.user_id || profile.id || ''),
      email: profile.email || null,
      name: [profile.first_name, profile.last_name].filter(Boolean).join(' ') || null,
      avatarUrl: profile.avatar || profile.photo_200 || null,
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
  createVkPkce,
  exchangeCodeForToken,
  fetchUserInfo,
  getAvailableProviders,
  normalizeProviderProfile,
};
