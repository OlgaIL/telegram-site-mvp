function presentSite(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    title: row.title,
    description: row.description,
    features: {
      widgetEnabled: row.widget_enabled,
      blogEnabled: row.blog_enabled,
    },
    channel: row.channel_id
      ? {
          id: row.channel_id,
          title: row.channel_title,
          username: row.channel_username,
        }
      : null,
  };
}

module.exports = { presentSite };
