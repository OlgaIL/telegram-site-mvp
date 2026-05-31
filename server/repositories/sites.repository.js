const { query } = require('../db');

const SITE_SELECT = `
  select
    s.id,
    s.channel_id,
    s.name,
    s.slug,
    s.title,
    s.description,
    s.subdomain,
    s.custom_domain,
    s.domain_status,
    s.widget_enabled,
    s.blog_enabled,
    s.created_at,
    s.updated_at,
    c.title as channel_title,
    c.username as channel_username
  from sites s
`;

const SITE_CHANNEL_JOIN = 'left join channels c on c.id = s.channel_id';

async function findSiteBySlug(slug) {
  const result = await query(
    `
      ${SITE_SELECT}
      ${SITE_CHANNEL_JOIN}
      where s.slug = $1
      limit 1;
    `,
    [slug],
  );

  return result.rows[0] || null;
}

async function findSiteByHost(host) {
  const result = await query(
    `
      ${SITE_SELECT}
      ${SITE_CHANNEL_JOIN}
      where lower(s.custom_domain) = lower($1)
         or lower(s.subdomain) = lower($2)
      order by s.updated_at desc, s.id desc
      limit 1;
    `,
    [host.domain, host.subdomain],
  );

  return result.rows[0] || null;
}

function normalizeChannelQuery(value) {
  return String(value || '')
    .trim()
    .replace(/^https?:\/\/t\.me\//i, '')
    .replace(/^t\.me\//i, '')
    .replace(/^@/, '')
    .replace(/\/$/, '');
}

async function findSiteByChannelQuery(value) {
  const normalized = normalizeChannelQuery(value);

  if (!normalized) {
    return null;
  }

  const result = await query(
    `
      ${SITE_SELECT}
      join channels c on c.id = s.channel_id
      where lower(c.username) = lower($1)
         or lower(c.title) = lower($2)
      order by s.updated_at desc, s.id desc
      limit 1;
    `,
    [normalized, String(value).trim()],
  );

  return result.rows[0] || null;
}

module.exports = { findSiteByChannelQuery, findSiteByHost, findSiteBySlug, normalizeChannelQuery };
