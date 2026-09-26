const express = require('express');
const {
  findLatestPosts,
  findLatestPostsByChannelId,
  findPostById,
  findPostByIdAndChannelId,
} = require('../repositories/posts.repository');
const { presentPost } = require('../presenters/post.presenter');
const { presentChannelRequest } = require('../presenters/channel-request.presenter');
const { presentSite } = require('../presenters/site.presenter');
const { presentUser } = require('../presenters/user.presenter');
const {
  createChannelRequest,
  findLatestChannelRequests,
  findLatestChannelRequestsByUserId,
} = require('../repositories/channel-requests.repository');
const { findSiteByChannelQuery } = require('../repositories/sites.repository');
const { findDetectedChannels } = require('../repositories/channels.repository');
const {
  completeChannelRequest,
  CompletionError,
} = require('../services/complete-channel-request.service');
const { resolveSiteBySlug } = require('../services/site-resolver.service');
const { getCurrentUser, isAdminUser } = require('../services/auth.service');
const { getAvailableProviders } = require('../services/oauth.service');

const apiRouter = express.Router();

async function requireAdmin(req, res, next) {
  try {
    const user = await getCurrentUser(req);

    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!isAdminUser(user)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    return next();
  } catch (err) {
    return next(err);
  }
}

apiRouter.get('/auth-providers', (req, res) => {
  return res.json({ items: getAvailableProviders() });
});

function parseLimit(value) {
  const limit = Number(value || 20);

  if (!Number.isFinite(limit) || limit < 1) {
    return 20;
  }

  return Math.min(Math.floor(limit), 50);
}

function isPositiveIntegerString(value) {
  return /^[1-9]\d*$/.test(String(value));
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

apiRouter.get('/posts', requireAdmin, async (req, res, next) => {
  try {
    const limit = parseLimit(req.query.limit);
    const posts = await findLatestPosts({ limit });

    res.json({
      items: posts.map(presentPost),
      meta: {
        limit,
        count: posts.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

apiRouter.get('/me', async (req, res, next) => {
  try {
    const user = await getCurrentUser(req);

    return res.json({
      authenticated: Boolean(user),
      user: user ? { ...presentUser(user), isAdmin: isAdminUser(user) } : null,
    });
  } catch (err) {
    return next(err);
  }
});

apiRouter.get('/posts/:id', requireAdmin, async (req, res, next) => {
  try {
    if (!isPositiveIntegerString(req.params.id)) {
      return res.status(400).json({ error: 'Invalid post id' });
    }

    const post = await findPostById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    return res.json(presentPost(post));
  } catch (err) {
    next(err);
  }
});

apiRouter.get('/channels/lookup', async (req, res, next) => {
  try {
    const query = String(req.query.query || '').trim();

    if (!query) {
      return res.status(400).json({ error: 'Channel query is required' });
    }

    const site = await findSiteByChannelQuery(query);

    if (!site) {
      return res.json({
        found: false,
        query,
        message: 'This channel is not added to our system yet.',
      });
    }

    return res.json({
      found: true,
      query,
      site: presentSite(site),
      url: `/site/${site.slug}`,
    });
  } catch (err) {
    next(err);
  }
});

apiRouter.post('/channel-requests', async (req, res, next) => {
  try {
    const user = await getCurrentUser(req);
    const telegramChannel = String(req.body.telegramChannel || '').trim();
    const email = String(req.body.email || '').trim();
    const comment = String(req.body.comment || '').trim();

    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!telegramChannel) {
      return res.status(400).json({ error: 'Telegram channel is required' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const request = await createChannelRequest({
      telegramChannel,
      email,
      comment,
      userId: user.id,
    });

    return res.status(201).json({
      ok: true,
      request: presentChannelRequest(request),
    });
  } catch (err) {
    next(err);
  }
});

apiRouter.get('/me/channel-requests', async (req, res, next) => {
  try {
    const user = await getCurrentUser(req);

    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const requests = await findLatestChannelRequestsByUserId({
      userId: user.id,
      limit: 20,
    });

    return res.json({
      items: requests.map(presentChannelRequest),
      meta: {
        count: requests.length,
      },
    });
  } catch (err) {
    return next(err);
  }
});

apiRouter.get('/channel-requests', requireAdmin, async (req, res, next) => {
  try {
    const requests = await findLatestChannelRequests({ limit: 50 });

    return res.json({
      items: requests.map(presentChannelRequest),
      meta: {
        count: requests.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

apiRouter.get('/admin/detected-channels', requireAdmin, async (req, res, next) => {
  try {
    const channels = await findDetectedChannels();

    return res.json({
      items: channels.map((channel) => ({
        id: channel.id,
        telegramChatId: channel.telegram_chat_id,
        title: channel.title,
        username: channel.username,
        detectedAt: channel.detected_at?.toISOString() || null,
        siteUrl: channel.site_slug ? `/site/${channel.site_slug}` : null,
      })),
    });
  } catch (err) {
    return next(err);
  }
});

apiRouter.post('/channel-requests/:id/complete', requireAdmin, async (req, res, next) => {
  try {
    if (!isPositiveIntegerString(req.params.id) || !isPositiveIntegerString(req.body?.channelId)) {
      return res.status(400).json({ error: 'Укажите заявку и найденный канал.' });
    }

    const site = await completeChannelRequest({
      requestId: req.params.id,
      channelId: req.body.channelId,
    });

    return res.json({ ok: true, site });
  } catch (err) {
    if (err instanceof CompletionError) {
      return res.status(err.status).json({ error: err.message });
    }

    return next(err);
  }
});

apiRouter.get('/sites/:slug', async (req, res, next) => {
  try {
    const site = await resolveSiteBySlug(req.params.slug);

    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    return res.json(presentSite(site));
  } catch (err) {
    next(err);
  }
});

apiRouter.get('/sites/:slug/posts', async (req, res, next) => {
  try {
    const site = await resolveSiteBySlug(req.params.slug);

    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    if (!site.channel_id) {
      return res.json({
        site: presentSite(site),
        items: [],
        meta: {
          limit: parseLimit(req.query.limit),
          count: 0,
        },
      });
    }

    const limit = parseLimit(req.query.limit);
    const posts = await findLatestPostsByChannelId({ channelId: site.channel_id, limit });

    return res.json({
      site: presentSite(site),
      items: posts.map(presentPost),
      meta: {
        limit,
        count: posts.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

apiRouter.get('/sites/:slug/posts/:id', async (req, res, next) => {
  try {
    if (!isPositiveIntegerString(req.params.id)) {
      return res.status(400).json({ error: 'Invalid post id' });
    }

    const site = await resolveSiteBySlug(req.params.slug);

    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    if (!site.channel_id) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const post = await findPostByIdAndChannelId({
      id: req.params.id,
      channelId: site.channel_id,
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    return res.json({
      site: presentSite(site),
      post: presentPost(post),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = { apiRouter };
