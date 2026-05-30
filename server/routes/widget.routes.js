const express = require('express');
const { env } = require('../config/env');

const widgetRouter = express.Router();

widgetRouter.get('/widget.js', (req, res) => {
  res.type('application/javascript');
  res.sendFile('widget.js', { root: `${__dirname}/../public` });
});

widgetRouter.get('/widget-demo', (req, res) => {
  res.render('widget-demo', {
    title: 'Widget demo',
    apiBaseUrl: env.publicBaseUrl,
  });
});

module.exports = { widgetRouter };
