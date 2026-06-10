const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || 'http://localhost:3000';

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

  return joinUrl(API_BASE_URL, url.startsWith('/') ? url : `/${url}`);
}

async function fetchJson(path) {
  const response = await fetch(joinUrl(API_BASE_URL, path), {
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

export async function lookupChannel(query) {
  return fetchJson(`/api/channels/lookup?query=${encodeURIComponent(query)}`);
}

export async function getSitePosts(slug, { limit = 20 } = {}) {
  return fetchJson(`/api/sites/${encodeURIComponent(slug)}/posts?limit=${limit}`);
}

export async function getSitePost(slug, id) {
  return fetchJson(`/api/sites/${encodeURIComponent(slug)}/posts/${encodeURIComponent(id)}`);
}

export async function createChannelRequest({ telegramChannel, email, comment }) {
  const response = await fetch(joinUrl(API_BASE_URL, '/api/channel-requests'), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      telegramChannel,
      email,
      comment,
    }),
    cache: 'no-store',
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

export async function getMe() {
  const response = await fetch(joinUrl(API_BASE_URL, '/api/me'), {
    cache: 'no-store',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}

export async function logout() {
  const response = await fetch(joinUrl(API_BASE_URL, '/auth/logout'), {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Logout failed: ${response.status}`);
  }

  return response.json();
}
