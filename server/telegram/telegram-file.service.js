const fs = require('fs/promises');
const path = require('path');
const { env } = require('../config/env');

function assertBotToken() {
  if (!env.telegramBotToken) {
    throw new Error('TELEGRAM_BOT_TOKEN is not configured');
  }
}

function getFileExtension(filePath) {
  const extension = path.extname(filePath || '').toLowerCase();

  return extension || '.jpg';
}

function sanitizeFilePart(value) {
  return String(value || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
}

async function getTelegramFile(fileId) {
  assertBotToken();

  const url = `https://api.telegram.org/bot${env.telegramBotToken}/getFile?file_id=${encodeURIComponent(fileId)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Telegram getFile failed with status ${response.status}`);
  }

  const payload = await response.json();

  if (!payload.ok || !payload.result || !payload.result.file_path) {
    throw new Error('Telegram getFile returned an invalid payload');
  }

  return payload.result;
}

async function downloadTelegramFile(filePath, targetPath) {
  assertBotToken();

  const url = `https://api.telegram.org/file/bot${env.telegramBotToken}/${filePath}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Telegram file download failed with status ${response.status}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(targetPath, bytes);
}

async function downloadPhotoByFileId(photo) {
  const file = await getTelegramFile(photo.file_id);
  const extension = getFileExtension(file.file_path);
  const nameSource = file.file_unique_id || photo.file_unique_id || photo.file_id;
  const fileName = `telegram_${sanitizeFilePart(nameSource)}${extension}`;
  const uploadsDir = path.resolve(env.uploadsDir);
  const targetPath = path.join(uploadsDir, fileName);

  await fs.mkdir(uploadsDir, { recursive: true });
  await downloadTelegramFile(file.file_path, targetPath);

  return {
    fileName,
    mediaUrl: `/uploads/telegram/${fileName}`,
    telegramFilePath: file.file_path,
  };
}

module.exports = { downloadPhotoByFileId };
