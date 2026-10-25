const assert = require('node:assert/strict');
const { before, test } = require('node:test');
let reportPage;
before(async () => ({ reportPage } = await import('../client/lib/metrika.mjs')));

function browser(hostname = 'tg4you.ru') {
  const scripts = [];
  const doc = {
    referrer: 'https://example.test/article?email=private@example.test#secret',
    scripts,
    head: { appendChild(script) { scripts.push(script); } },
    createElement() { return {}; },
  };
  const win = { location: { hostname, origin: 'https://' + hostname } };
  return { win, doc, scripts, calls: () => (win.ym?.a || []).map(call => [...call]) };
}

test('counter never starts on localhost, other preview hosts or development builds', () => {
  for (const [host, production] of [['localhost', true], ['127.0.0.1', true], ['preview.example.test', true], ['tg4you.ru', false]]) {
    const b = browser(host);
    reportPage(b.win, b.doc, '/', production);
    assert.equal(b.scripts.length, 0);
    assert.equal(b.calls().length, 0);
  }
});

test('initial visit and App Router navigation have one init and one hit per page', () => {
  const b = browser();
  reportPage(b.win, b.doc, '/', true);
  reportPage(b.win, b.doc, '/', true);
  reportPage(b.win, b.doc, '/site/default', true);
  reportPage(b.win, b.doc, '/site/default', true);
  const calls = b.calls();
  assert.deepEqual(calls.map(call => call[1]), ['init', 'hit', 'hit']);
  assert.ok(calls.every(call => call[0] === 113788018));
  assert.equal(calls[0][2].defer, true);
  assert.equal(calls[0][2].webvisor, true);
  assert.equal(calls[2][3].referer, 'https://tg4you.ru/');
  assert.equal(b.scripts.length, 1);
  assert.equal(b.scripts[0].src, 'https://mc.yandex.ru/metrika/tag.js?id=113788018');
  assert.equal(b.scripts[0].async, true);
});

test('page views and referrers omit query and fragment values', () => {
  const b = browser('www.tg4you.ru');
  reportPage(b.win, b.doc, '/login?email=private@example.test&code=123456#secret', true);
  const calls = b.calls();
  assert.equal(calls[0][2].url, 'https://www.tg4you.ru/login');
  assert.equal(calls[0][2].referrer, 'https://example.test/article');
  assert.equal(calls[1][2], 'https://www.tg4you.ru/login');
  assert.doesNotMatch(JSON.stringify(calls), /private@example|123456|secret/);
});

test('back navigation is counted while an existing loader is not duplicated', () => {
  const b = browser();
  b.scripts.push({ src: 'https://mc.yandex.ru/metrika/tag.js?id=113788018' });
  reportPage(b.win, b.doc, '/', true);
  reportPage(b.win, b.doc, '/site/default', true);
  reportPage(b.win, b.doc, '/', true);
  assert.equal(b.scripts.length, 1);
  assert.equal(b.calls().filter(call => call[1] === 'hit').length, 3);
});
