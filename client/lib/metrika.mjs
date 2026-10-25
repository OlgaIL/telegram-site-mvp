export const COUNTER_ID = 113788018;

const HOSTS = new Set(['tg4you.ru', 'www.tg4you.ru']);
const STATE_KEY = '__telegramMirrorMetrika';

function cleanUrl(value, base) {
  if (!value) return '';
  try {
    const url = new URL(value, base);
    return ['https:', 'http:'].includes(url.protocol) ? url.origin + url.pathname : '';
  } catch {
    return '';
  }
}

// The counter is deliberately inactive on localhost and other preview hosts.
export function reportPage(win, doc, pathname, production) {
  if (!production || !HOSTS.has(win.location.hostname) || !pathname) return;
  let state = win[STATE_KEY];
  const url = cleanUrl(pathname, win.location.origin);
  if (!url) return;

  if (!state) {
    state = { lastUrl: '', referrer: cleanUrl(doc.referrer, win.location.origin) };
    win[STATE_KEY] = state;
    win.ym = win.ym || function () { (win.ym.a = win.ym.a || []).push(arguments); };
    win.ym.l = Date.now();
    win.ym(COUNTER_ID, 'init', {
      ssr: true,
      defer: true,
      webvisor: true,
      clickmap: true,
      accurateTrackBounce: true,
      trackLinks: true,
      referrer: state.referrer,
      url,
    });

    const src = 'https://mc.yandex.ru/metrika/tag.js?id=' + COUNTER_ID;
    if (![...doc.scripts].some(script => script.src === src)) {
      const script = doc.createElement('script');
      script.async = true;
      script.src = src;
      doc.head.appendChild(script);
    }
  }

  // App Router navigation and repeated effects must not duplicate page views.
  if (state.lastUrl === url) return;
  win.ym(COUNTER_ID, 'hit', url, {
    referer: state.lastUrl || state.referrer,
    title: 'Telegram Зеркало',
  });
  state.lastUrl = url;
}
