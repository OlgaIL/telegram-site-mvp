const assert = require('node:assert/strict');
const test = require('node:test');
const nodemailer = require('nodemailer');
const { env } = require('../server/config/env');

test('email template uses Telegram branding and shares the verified SMTP transport', async (t) => {
  const previous = { ...env };
  Object.assign(env, {
    smtpHost: 'smtp.example.test', smtpPort: 465, smtpSecure: true,
    smtpUser: 'sender@example.test', smtpPassword: 'test-only', smtpFrom: 'sender@example.test',
  });
  let options;
  let message;
  let created = 0;
  t.mock.method(nodemailer, 'createTransport', (config) => {
    created += 1;
    options = config;
    return {
      verify: async () => true,
      sendMail: async (value) => { message = value; },
    };
  });
  try {
    const { sendEmailLoginCode, verifyEmailTransport } = require('../server/services/email-delivery.service');
    assert.equal(await verifyEmailTransport(), true);
    await sendEmailLoginCode({ email: 'recipient@example.test', code: '012345', ttlMinutes: 10 });
    assert.equal(created, 1);
    assert.equal(options.host, 'smtp.example.test');
    assert.equal(options.secure, true);
    assert.equal(message.from, 'sender@example.test');
    assert.equal(message.to, 'recipient@example.test');
    assert.match(message.subject, /Telegram Зеркало/);
    assert.ok(message.text.includes('012345'));
    assert.ok(message.html.includes('012345'));
    assert.ok(message.text.includes('https://tg4you.ru/'));
    assert.ok(message.html.includes('href="https://tg4you.ru/"'));
    assert.ok(!message.html.includes('word2you'));
    await assert.rejects(
      () => sendEmailLoginCode({ email: 'recipient@example.test', code: '<bad>', ttlMinutes: 10 }),
      /Invalid email login message/,
    );
  } finally {
    Object.assign(env, previous);
  }
});
