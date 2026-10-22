const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const test = require('node:test');
process.env.DOTENV_CONFIG_QUIET = 'true';
const { env } = require('../server/config/env');
Object.assign(env, { vkAuthEnabled: true, vkClientId: 'test-app', vkCallbackUrl: 'http://localhost:3000/auth/vk/callback' });
const { buildAuthorizationUrl, createVkPkce, exchangeCodeForToken } = require('../server/services/oauth.service');

test('VK authorization uses PKCE and preserves the callback state', () => {
  const context = createVkPkce();
  const url = new URL(buildAuthorizationUrl('vk', 'test-state', context));
  assert.equal(url.searchParams.get('state'), 'test-state');
  assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(url.searchParams.get('code_challenge'),
    crypto.createHash('sha256').update(context.codeVerifier).digest('base64url'));
  assert.equal(url.searchParams.get('redirect_uri'), env.vkCallbackUrl);
  assert.ok(!url.toString().includes(context.codeVerifier));
});

test('VK token exchange sends verifier, device and state, then validates response state', async (t) => {
  let responseState = 'test-state';
  t.mock.method(global, 'fetch', async (url, options) => {
    assert.equal(url, 'https://id.vk.com/oauth2/auth');
    assert.equal(options.body.get('state'), 'test-state');
    assert.equal(options.body.get('code_verifier'), 'test-verifier');
    assert.equal(options.body.get('device_id'), 'test-device');
    return { ok: true, json: async () => ({ access_token: 'test-token', state: responseState }) };
  });
  const context = { codeVerifier: 'test-verifier', deviceId: 'test-device', state: 'test-state' };
  assert.equal((await exchangeCodeForToken('vk', 'test-code', context)).access_token, 'test-token');
  responseState = 'wrong-state';
  await assert.rejects(() => exchangeCodeForToken('vk', 'test-code', context), /state validation failed/);
  await assert.rejects(() => exchangeCodeForToken('vk', 'test-code', { deviceId: 'test-device' }), /missing PKCE data/);
});
