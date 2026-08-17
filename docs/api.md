# Public API

Read-only endpoints for posts.

Auth endpoints use httpOnly session cookies.

## GET /api/auth-providers

Returns only the OAuth providers enabled and configured on the server.

```json
{
  "items": [
    { "id": "google", "label": "Google" },
    { "id": "yandex", "label": "Яндекс" },
    { "id": "vk", "label": "VK" }
  ]
}
```

## GET /api/me

Returns the current authenticated user.

```json
{
  "authenticated": true,
  "user": {
    "id": "1",
    "email": "owner@example.com",
    "name": "Owner",
    "avatarUrl": "https://...",
    "createdAt": "2026-06-08T16:10:54.000Z"
  }
}
```

Anonymous response:

```json
{
  "authenticated": false,
  "user": null
}
```

## GET /auth/yandex

Starts Yandex OAuth and redirects to Yandex.

## GET /auth/yandex/callback

Completes Yandex OAuth, creates/updates local user, starts a session, and redirects to the frontend dashboard.

## GET /auth/google

Starts Google OAuth. Requires Google OAuth env values before live use.

## GET /auth/google/callback

Completes Google OAuth, creates/updates local user, starts a session, and redirects to the frontend dashboard.

## GET /auth/vk

Starts VK OAuth. Available only when `VK_AUTH_ENABLED=true` and all VK variables are configured.

## GET /auth/vk/callback

Completes VK OAuth, creates/updates local user, starts a session, and redirects to the requested frontend page.

## POST /auth/logout

Deletes the current session cookie.

```json
{ "ok": true }
```

## GET /api/posts

Query params:

```text
limit
```

Default limit is `20`. Maximum limit is `50`.

Response:

```json
{
  "items": [
    {
      "id": "9",
      "channel": {
        "id": "2",
        "title": "Test Site Tele",
        "username": "test_site_tele"
      },
      "telegramMessageId": "8",
      "text": null,
      "caption": null,
      "content": null,
      "media": {
        "type": "photo",
        "url": "/uploads/telegram/telegram_AQADchVrGz--AAFIfg.jpg",
        "telegramFileId": "AgAC...",
        "status": "downloaded"
      },
      "originalUrl": "https://t.me/test_site_tele/8",
      "publishedAt": "2026-05-09T20:53:00.000Z",
      "editedAt": null,
      "createdAt": "2026-05-09T20:53:00.704Z",
      "updatedAt": "2026-05-09T20:53:00.704Z"
    }
  ],
  "meta": {
    "limit": 20,
    "count": 1
  }
}
```

## GET /api/posts/:id

Returns one post.

Errors:

```json
{ "error": "Invalid post id" }
```

```json
{ "error": "Post not found" }
```

## GET /api/sites/:slug

Returns public site metadata.

```json
{
  "id": "1",
  "slug": "default",
  "name": "Test Site Tele",
  "title": "Test Site Tele",
  "description": "Telegram-powered updates",
  "domain": {
    "subdomain": null,
    "customDomain": null,
    "status": "not_configured"
  },
  "features": {
    "widgetEnabled": true,
    "blogEnabled": true
  },
  "channel": {
    "id": "6",
    "title": "Test Site Tele",
    "username": "test_site_tele"
  }
}
```

## GET /api/sites/:slug/posts

Returns posts for one site.

```text
GET /api/sites/default/posts?limit=5
```

Response shape:

```json
{
  "site": {},
  "items": [],
  "meta": {
    "limit": 5,
    "count": 0
  }
}
```

## GET /api/sites/:slug/posts/:id

Returns one post for one site.

Response shape:

```json
{
  "site": {},
  "post": {}
}
```

## GET /api/channels/lookup

Looks up a connected channel by username, title, or `t.me` URL.

```text
GET /api/channels/lookup?query=@test_site_tele
```

Connected response:

```json
{
  "found": true,
  "query": "@test_site_tele",
  "site": {},
  "url": "/site/default"
}
```

Not connected response:

```json
{
  "found": false,
  "query": "@unknown_channel",
  "message": "This channel is not added to our system yet."
}
```

## POST /api/channel-requests

Creates a draft request to add a Telegram channel.

Request:

```json
{
  "telegramChannel": "@example_channel",
  "email": "owner@example.com",
  "comment": "Optional setup note"
}
```

## GET /api/channel-requests

Returns latest channel requests for the internal draft admin page.

```json
{
  "items": [
    {
      "id": "1",
      "telegramChannel": "@example_channel",
      "email": "owner@example.com",
      "comment": "Optional setup note",
      "status": "new",
      "createdAt": "2026-05-22T13:49:17.329Z"
    }
  ],
  "meta": {
    "count": 1
  }
}
```

Response:

```json
{
  "ok": true,
  "request": {
    "id": "1",
    "telegramChannel": "@example_channel",
    "email": "owner@example.com",
    "comment": "Optional setup note",
    "status": "new",
    "createdAt": "2026-05-22T13:49:17.329Z"
  }
}
```
