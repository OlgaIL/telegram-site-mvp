const { verifyEmailTransport } = require('../server/services/email-delivery.service');

verifyEmailTransport()
  .then(() => console.log('SMTP OK'))
  .catch((error) => {
    console.error('SMTP ERROR:', error.code || 'UNKNOWN', error.responseCode || '', error.command || '');
    process.exitCode = 1;
  });
