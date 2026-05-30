# Backlog

## Technical Debt

- Add authorization before exposing `/admin/channel-requests`.
- Add auto-refresh for widget.
- Add retry strategy for failed media downloads.
- Decide how to clean old local media files.
- Normalize docs before first commit.

## Product Architecture

- Expand the initial `sites` model into full `projects` / `settings`.
- Replace draft channel request flow with auth + real onboarding.
- Add widget mode.
- Add customer-facing blog/subdomain mode.
- Add dashboard/admin for site settings.

## Deployment

- Prepare VPS process model.
- Configure nginx reverse proxy.
- Configure persistent uploads storage.
- Document Telegram proxy/VPN option through `TELEGRAM_PROXY_URL`.
