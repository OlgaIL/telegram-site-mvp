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
const {
  createChannelRequest,
  findLatestChannelRequests,
} = require('../repositories/channel-requests.repository');
const { findSiteByChannelQuery, findSiteBySlug } = require('../repositories/sites.repository');

const apiRouter = express.Router();

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

apiRouter.get('/posts', async (req, res, next) => {
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

apiRouter.get('/posts/:id', async (req, res, next) => {
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
    const telegramChannel = String(req.body.telegramChannel || '').trim();
    const email = String(req.body.email || '').trim();
    const comment = String(req.body.comment || '').trim();

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
    });

    return res.status(201).json({
      ok: true,
      request: presentChannelRequest(request),
    });
  } catch (err) {
    next(err);
  }
});

apiRouter.get('/channel-requests', async (req, res, next) => {
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

apiRouter.get('/sites/:slug', async (req, res, next) => {
  try {
    const site = await findSiteBySlug(req.params.slug);

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
    const site = await findSiteBySlug(req.params.slug);

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

    const site = await findSiteBySlug(req.params.slug);

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
