const express = require('express');
const router = express.Router();
const { bot } = require('../bot');

// Получить информацию о боте
router.get('/bot-info', async (req, res) => {
  try {
    // Получаем информацию о боте через Telegram API
    const botInfo = await bot.telegram.getMe();
    
    res.json({
      id: botInfo.id,
      is_bot: botInfo.is_bot,
      first_name: botInfo.first_name,
      username: botInfo.username,
      can_join_groups: botInfo.can_join_groups,
      can_read_all_group_messages: botInfo.can_read_all_group_messages,
      supports_inline_queries: botInfo.supports_inline_queries
    });
  } catch (error) {
    console.error('Error getting bot info:', error);
    res.status(500).json({ error: 'Failed to get bot info' });
  }
});

// Проверить статус бота
router.get('/status', (req, res) => {
  try {
    // Проверяем, запущен ли бот
    if (bot.botInfo) {
      res.json({
        status: 'active',
        bot_username: bot.botInfo.username,
        message: 'Telegram bot is running'
      });
    } else {
      res.json({
        status: 'inactive',
        message: 'Telegram bot is not running'
      });
    }
  } catch (error) {
    console.error('Error checking bot status:', error);
    res.status(500).json({ error: 'Failed to check bot status' });
  }
});

module.exports = router;
