# Backlog

## Technical Debt

- Add authorization before exposing `/admin/channel-requests`.
- Add auto-refresh for widget.
- Add retry strategy for failed media downloads.
- Decide how to clean old local media files.
- Add real host-based site resolution after DNS/VPS setup.

## Product Architecture

- Add auth after the `sites` model is stable.
- Add user ownership for sites and channel requests.
- Add dashboard/admin for site settings.
- Add widget mode production flow.
- Add customer-facing blog/subdomain mode.
- Add custom client domain onboarding.

## Deployment

- Prepare VPS process model.
- Configure nginx reverse proxy.
- Configure persistent uploads storage.
- Document Telegram proxy/VPN option through `TELEGRAM_PROXY_URL`.
