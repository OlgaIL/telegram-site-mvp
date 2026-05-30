const express = require('express');
const { findLatestPosts, findPostById } = require('../repositories/posts.repository');

const feedRouter = express.Router();

feedRouter.get('/feed', async (req, res, next) => {
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

feedRouter.get('/feed/:id', async (req, res, next) => {
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
