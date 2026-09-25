function presentChannelRequest(row) {
  return {
    id: row.id,
    userId: row.user_id,
    telegramChannel: row.telegram_channel,
    email: row.email,
    comment: row.comment,
    status: row.status,
    siteSlug: row.site_slug || null,
    siteUrl: row.site_slug ? `/site/${row.site_slug}` : null,
    createdAt: row.created_at ? row.created_at.toISOString() : null,
  };
}

module.exports = { presentChannelRequest };
