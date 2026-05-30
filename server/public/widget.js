(function () {
  var script = document.currentScript;
  var apiBaseUrl = script && script.dataset.apiBaseUrl ? script.dataset.apiBaseUrl : '';
  var targetSelector = script && script.dataset.target ? script.dataset.target : '#telegram-site-widget';
  var siteSlug = script && script.dataset.site ? script.dataset.site : 'default';
  var limit = script && script.dataset.limit ? Number(script.dataset.limit) : 5;
  var target = document.querySelector(targetSelector);

  if (!target) {
    return;
  }

  function joinUrl(baseUrl, path) {
    return String(baseUrl || '').replace(/\/$/, '') + path;
  }

  function mediaUrl(url) {
    if (!url) {
      return null;
    }

    if (/^https?:\/\//i.test(url)) {
      return url;
    }

    return joinUrl(apiBaseUrl, url.charAt(0) === '/' ? url : '/' + url);
  }

  function formatDate(value) {
    if (!value) {
      return '';
    }

    try {
      return new Intl.DateTimeFormat('ru-RU', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(value));
    } catch (err) {
      return value;
    }
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderError() {
    target.innerHTML = '<div class="tsw-error">Posts are temporarily unavailable.</div>';
  }

  function renderPosts(posts) {
    if (!posts.length) {
      target.innerHTML = '<div class="tsw-empty">Posts are not here yet.</div>';
      return;
    }

    target.innerHTML =
      '<div class="tsw-root">' +
      posts
        .map(function (post) {
          var imageUrl = post.media && post.media.type === 'photo' ? mediaUrl(post.media.url) : null;
          var content = post.content ? '<p class="tsw-text">' + escapeHtml(post.content) + '</p>' : '';
          var image = imageUrl ? '<img class="tsw-image" src="' + escapeHtml(imageUrl) + '" alt="">' : '';
          var telegramLink = post.originalUrl
            ? '<a class="tsw-link" href="' + escapeHtml(post.originalUrl) + '" target="_blank" rel="noreferrer">Open in Telegram</a>'
            : '';

          return (
            '<article class="tsw-post">' +
            '<div class="tsw-meta">' +
            '<strong>' +
            escapeHtml((post.channel && post.channel.title) || 'Telegram channel') +
            '</strong>' +
            '<time>' +
            escapeHtml(formatDate(post.publishedAt || post.createdAt)) +
            '</time>' +
            '</div>' +
            content +
            image +
            telegramLink +
            '</article>'
          );
        })
        .join('') +
      '</div>';
  }

  function injectStyles() {
    if (document.getElementById('telegram-site-widget-styles')) {
      return;
    }

    var style = document.createElement('style');
    style.id = 'telegram-site-widget-styles';
    style.textContent =
      '.tsw-root{display:grid;gap:12px;font-family:Arial,Helvetica,sans-serif;color:#17202a}' +
      '.tsw-post{padding:12px;border:1px solid #d8dee6;border-radius:8px;background:#fff}' +
      '.tsw-meta{display:flex;gap:8px;justify-content:space-between;color:#667482;font-size:13px}' +
      '.tsw-meta strong{color:#17202a}' +
      '.tsw-meta time{text-align:right}' +
      '.tsw-text{margin:10px 0;white-space:pre-wrap;line-height:1.45}' +
      '.tsw-image{display:block;width:100%;max-height:360px;object-fit:contain;margin:10px 0;border-radius:6px;background:#edf1f5}' +
      '.tsw-link{display:inline-block;margin-top:8px;color:#0b5cad;text-underline-offset:3px}' +
      '.tsw-empty,.tsw-error{font-family:Arial,Helvetica,sans-serif;color:#667482}';
    document.head.appendChild(style);
  }

  injectStyles();
  target.innerHTML = '<div class="tsw-empty">Loading posts...</div>';

  fetch(
    joinUrl(
      apiBaseUrl,
      '/api/sites/' + encodeURIComponent(siteSlug) + '/posts?limit=' + encodeURIComponent(limit),
    ),
  )
    .then(function (response) {
      if (!response.ok) {
        throw new Error('API request failed');
      }

      return response.json();
    })
    .then(function (data) {
      renderPosts(data.items || []);
    })
    .catch(function () {
      renderError();
    });
})();
