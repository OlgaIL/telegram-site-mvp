const PUBLIC_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || 'http://localhost:3000';
const SERVER_API_BASE_URL = process.env.API_BASE_URL || PUBLIC_API_BASE_URL;

function getApiBaseUrl() {
  return typeof window === 'undefined' ? SERVER_API_BASE_URL : PUBLIC_API_BASE_URL;
}

function joinUrl(baseUrl, path) {
  return `${baseUrl.replace(/\/$/, '')}${path}`;
}

export function absoluteMediaUrl(url) {
  if (!url) {
    return null;
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return joinUrl(PUBLIC_API_BASE_URL, url.startsWith('/') ? url : `/${url}`);
}

async function fetchJson(path) {
  const response = await fetch(joinUrl(getApiBaseUrl(), path), {
    cache: 'no-store',
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}

export async function getPosts({ limit = 20 } = {}) {
  return fetchJson(`/api/posts?limit=${limit}`);
}

export async function getPost(id) {
  return fetchJson(`/api/posts/${id}`);
}

export async function getAuthProviders() {
  return fetchJson('/api/auth-providers');
}

export async function lookupChannel(query) {
  return fetchJson(`/api/channels/lookup?query=${encodeURIComponent(query)}`);
}

export async function getSitePosts(slug, { limit = 20 } = {}) {
  return fetchJson(`/api/sites/${encodeURIComponent(slug)}/posts?limit=${limit}`);
}

export async function getSitePost(slug, id) {
  return fetchJson(`/api/sites/${encodeURIComponent(slug)}/posts/${encodeURIComponent(id)}`);
}

export async function createChannelRequest({ telegramChannel, email, comment, cookieHeader = '' }) {
  const response = await fetch(joinUrl(getApiBaseUrl(), '/api/channel-requests'), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
    },
    body: JSON.stringify({
      telegramChannel,
      email,
      comment,
    }),
    cache: 'no-store',
    credentials: 'include',
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      error: payload.error || 'Request failed',
    };
  }

  return payload;
}

export async function getChannelRequests() {
  return fetchJson('/api/channel-requests');
}

export async function getMyChannelRequests() {
  const response = await fetch(joinUrl(getApiBaseUrl(), '/api/me/channel-requests'), {
    cache: 'no-store',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}

export async function getMe() {
  const response = await fetch(joinUrl(getApiBaseUrl(), '/api/me'), {
    cache: 'no-store',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}

export async function getMeWithCookie(cookieHeader = '') {
  const response = await fetch(joinUrl(getApiBaseUrl(), '/api/me'), {
    cache: 'no-store',
    headers: cookieHeader ? { cookie: cookieHeader } : {},
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}

export async function logout() {
  const response = await fetch(joinUrl(getApiBaseUrl(), '/auth/logout'), {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Logout failed: ${response.status}`);
  }

  return response.json();
}
