const nodemailer = require('nodemailer');
const { env } = require('../config/env');

let transporter;

function getEmailTransport() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      requireTLS: !env.smtpSecure,
      auth: { user: env.smtpUser, pass: env.smtpPassword },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      disableFileAccess: true,
      disableUrlAccess: true,
    });
  }
  return transporter;
}

async function sendEmailLoginCode({ email, code, ttlMinutes }) {
  if (!/^\d{6}$/.test(String(code)) || !Number.isInteger(ttlMinutes) || ttlMinutes <= 0) {
    throw new TypeError('Invalid email login message');
  }
  await getEmailTransport().sendMail({
    from: env.smtpFrom,
    to: email,
    subject: 'Код для входа в Telegram Зеркало',
    text: [
      'Ваш код для входа в Telegram Зеркало: ' + code,
      '',
      'Код действует ' + ttlMinutes + ' минут.',
      'Если вы не запрашивали код, просто игнорируйте это письмо.',
      '',
      'Telegram Зеркало: https://tg4you.ru/',
    ].join('\n'),
    html: [
      '<!doctype html><html lang="ru"><body style="margin:0;background:#ffffff;color:#17202a;font-family:Arial,sans-serif;">',
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px;">',
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;"><tr><td>',
      '<a href="https://tg4you.ru/" style="color:#17202a;font-size:20px;text-decoration:none;">Telegram Зеркало</a>',
      '<p style="margin:28px 0 12px;">Ваш код для входа:</p>',
      '<p style="margin:0 0 24px;font-size:32px;font-family:Consolas,monospace;letter-spacing:0;">' + code + '</p>',
      '<p>Код действует ' + ttlMinutes + ' минут.</p>',
      '<p style="color:#647382;font-size:14px;line-height:1.5;">Если вы не запрашивали код, просто проигнорируйте это письмо.</p>',
      '<p style="margin-top:28px;"><a href="https://tg4you.ru/" style="color:#1368b3;">tg4you.ru</a></p>',
      '</td></tr></table></td></tr></table></body></html>',
    ].join(''),
  });
}

async function verifyEmailTransport() {
  return getEmailTransport().verify();
}

module.exports = { sendEmailLoginCode, verifyEmailTransport };
