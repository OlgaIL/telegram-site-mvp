const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const test = require('node:test');
const { normalizeReturnTo } = require('../server/utils/auth-redirect');

function providers(settings) {
  const output = execFileSync(process.execPath, [
    '-e',
    "console.log(JSON.stringify(require('./server/services/auth-providers.service').getAvailableProviders()))",
  ], {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf8',
    env: {
      ...process.env,
      DOTENV_CONFIG_QUIET: 'true',
      YANDEX_AUTH_ENABLED: 'false',
      GOOGLE_AUTH_ENABLED: 'false',
      VK_AUTH_ENABLED: 'false',
      EMAIL_AUTH_ENABLED: 'false',
      EMAIL_OTP_SECRET: 'test-secret-only-'.repeat(4),
      SMTP_HOST: 'smtp.example.test',
      SMTP_USER: 'sender@example.test',
      SMTP_PASSWORD: 'test-only',
      SMTP_FROM: 'sender@example.test',
      ...settings,
    },
  });
  return JSON.parse(output.trim().split('\n').at(-1));
}

test('all auth providers can be disabled with env flags', () => {
  assert.deepEqual(providers({}), []);
});

test('configured email is available independently of OAuth', () => {
  assert.deepEqual(providers({ EMAIL_AUTH_ENABLED: 'true' }), [{ id: 'email', label: 'Почта' }]);
  assert.deepEqual(providers({ EMAIL_AUTH_ENABLED: 'true', EMAIL_OTP_SECRET: '' }), []);
  assert.deepEqual(providers({ EMAIL_AUTH_ENABLED: 'true', SMTP_PASSWORD: '' }), []);
});

test('OAuth flags require credentials and expose no credentials in the public list', () => {
  const items = providers({
    GOOGLE_AUTH_ENABLED: 'true', GOOGLE_CLIENT_ID: 'test-id', GOOGLE_CLIENT_SECRET: 'test-secret',
    YANDEX_AUTH_ENABLED: 'true', YANDEX_CLIENT_ID: 'test-id', YANDEX_CLIENT_SECRET: 'test-secret',
    VK_AUTH_ENABLED: 'true', VK_CLIENT_ID: 'test-id', VK_CLIENT_SECRET: '',
  });
  assert.deepEqual(items, [
    { id: 'yandex', label: 'Яндекс' },
    { id: 'google', label: 'Google' },
    { id: 'vk', label: 'VK' },
  ]);
  assert.deepEqual(providers({ GOOGLE_AUTH_ENABLED: 'true', GOOGLE_CLIENT_ID: '' }), []);
});

test('auth returns to the requested local page and rejects external redirects', () => {
  assert.equal(normalizeReturnTo('/add-channel'), '/add-channel');
  assert.equal(normalizeReturnTo('/admin/channel-requests?status=new'), '/admin/channel-requests?status=new');
  for (const target of [undefined, null, ['//evil.test'], 'https://evil.test', '//evil.test', '/\\evil.test', '/\n/evil.test']) {
    assert.equal(normalizeReturnTo(target), '/dashboard');
  }
});
