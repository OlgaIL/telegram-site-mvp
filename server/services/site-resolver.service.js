const { findSiteByHost, findSiteBySlug } = require('../repositories/sites.repository');

function normalizeHostHeader(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, '')
    .replace(/\.$/, '');
}

function getSubdomainFromHost(host) {
  const normalized = normalizeHostHeader(host);

  if (!normalized || normalized === 'localhost' || normalized === '127.0.0.1') {
    return '';
  }

  return normalized.split('.')[0] || '';
}

async function resolveSiteBySlug(slug) {
  return findSiteBySlug(slug);
}

async function resolveSiteByHost(hostHeader) {
  const domain = normalizeHostHeader(hostHeader);

  if (!domain) {
    return null;
  }

  return findSiteByHost({
    domain,
    subdomain: getSubdomainFromHost(domain),
  });
}

module.exports = { getSubdomainFromHost, normalizeHostHeader, resolveSiteByHost, resolveSiteBySlug };
