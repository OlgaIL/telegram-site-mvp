const { logger } = require('../config/logger');
const { downloadPhotoByFileId } = require('../telegram/telegram-file.service');

function selectLargestPhoto(photos) {
  if (!Array.isArray(photos) || photos.length === 0) {
    return null;
  }

  return photos.reduce((largest, current) => {
    const largestScore = (largest.width || 0) * (largest.height || 0);
    const currentScore = (current.width || 0) * (current.height || 0);

    if (currentScore > largestScore) {
      return current;
    }

    if (currentScore === largestScore && (current.file_size || 0) > (largest.file_size || 0)) {
      return current;
    }

    return largest;
  }, photos[0]);
}

async function processTelegramPhoto(photo) {
  if (!photo) {
    return {
      mediaType: 'none',
      mediaUrl: null,
      telegramFileId: null,
      mediaStatus: 'none',
    };
  }

  logger.info({ telegramFileId: photo.file_id }, 'media download started');

  try {
    const downloadResult = await downloadPhotoByFileId(photo);

    return {
      mediaType: 'photo',
      mediaUrl: downloadResult.mediaUrl,
      telegramFileId: photo.file_id,
      mediaStatus: 'downloaded',
    };
  } catch (err) {
    logger.error({ err, telegramFileId: photo.file_id }, 'media download failed');

    return {
      mediaType: 'photo',
      mediaUrl: null,
      telegramFileId: photo.file_id,
      mediaStatus: 'error',
    };
  }
}

module.exports = { processTelegramPhoto, selectLargestPhoto };
