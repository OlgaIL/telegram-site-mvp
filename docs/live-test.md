# Telegram Live Test

Use this checklist when testing real Telegram updates locally.

## 1. Start App

```bash
cd C:\Users\olgak\PROJECTS\telegram-site-mvp
npm.cmd run dev
```

Expected:

```text
http://localhost:3000/health -> {"status":"ok"}
http://localhost:3001/       -> frontend loads
```

## 2. Start Tunnel

```bash
ngrok http 3000
```

Copy the HTTPS forwarding URL.

## 3. Set Webhook

Set webhook to:

```text
https://<ngrok-host>/telegram/webhook
```

Check webhook state:

```text
https://api.telegram.org/bot<token>/getWebhookInfo
```

## 4. Send Posts

In the test channel, send:

- one text post;
- one photo post.

## 5. Verify

Check:

```text
http://localhost:3000/api/posts
http://localhost:3001/
```

The newest posts should be first. Photo posts should have:

```text
media.type = photo
media.status = downloaded
media.url = /uploads/telegram/...
```
