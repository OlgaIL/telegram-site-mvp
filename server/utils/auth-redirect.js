function normalizeReturnTo(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') ||
      /[\\\u0000-\u0020]/.test(value)) {
    return '/dashboard';
  }
  return value;
}

module.exports = { normalizeReturnTo };
