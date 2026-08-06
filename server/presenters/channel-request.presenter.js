function presentChannelRequest(row) {
  return {
    id: row.id,
    userId: row.user_id,
    telegramChannel: row.telegram_channel,
    email: row.email,
    comment: row.comment,
    status: row.status,
    createdAt: row.created_at ? row.created_at.toISOString() : null,
  };
}

module.exports = { presentChannelRequest };
