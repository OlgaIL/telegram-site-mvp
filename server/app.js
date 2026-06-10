const express = require('express');
const path = require('path');
const { env } = require('./config/env');
const { logger } = require('./config/logger');
const { apiRouter } = require('./routes/api.routes');
const { healthRouter } = require('./routes/health.routes');
const { feedRouter } = require('./routes/feed.routes');
const { telegramRouter } = require('./routes/telegram.routes');
const { widgetRouter } = require('./routes/widget.routes');
const { authRouter } = require('./routes/auth.routes');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', env.frontendOrigin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  return next();
});

app.use(express.json({ limit: '2mb' }));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/uploads/telegram', express.static(path.resolve(env.uploadsDir)));

app.use(healthRouter);
app.use('/auth', authRouter);
app.use('/api', apiRouter);
app.use(feedRouter);
app.use(widgetRouter);
app.use('/telegram', telegramRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  logger.error({ err }, 'request failed');
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = { app };
