const express = require('express');
const { findLatestPosts, findPostById } = require('../repositories/posts.repository');
const { getCurrentUser, isAdminUser } = require('../services/auth.service');

const feedRouter = express.Router();

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

feedRouter.get('/feed', requireAdmin, async (req, res, next) => {
  try {
    const posts = await findLatestPosts({ limit: 50 });

    res.render('feed', {
      title: 'Draft feed',
      posts,
    });
  } catch (err) {
    next(err);
  }
});

feedRouter.get('/feed/:id', requireAdmin, async (req, res, next) => {
  try {
    const post = await findPostById(req.params.id);

    if (!post) {
      return res.status(404).render('post', {
        title: 'Post not found',
        post: null,
      });
    }

    return res.render('post', {
      title: 'Draft post',
      post,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = { feedRouter };
