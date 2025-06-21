const { Telegraf } = require('telegraf');
require('dotenv').config();

/**
 * Отправляет сообщение пользователю через Telegram бота
 * @param {string} telegramId - Telegram ID пользователя
 * @param {string} message - Текст сообщения
 * @param {boolean} useMarkdown - Использовать ли форматирование Markdown
 * @returns {Promise<boolean>} - Результат отправки сообщения
 */
const sendMessageToUser = async (telegramId, message, useMarkdown = false) => {
  try {
    // Создаем новый экземпляр бота для отправки сообщения
    const tempBot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

    // Проверяем, не содержит ли сообщение специальных символов Markdown
    // которые могут вызвать ошибку при отправке
    if (useMarkdown) {
      try {
        // Отправляем сообщение с форматированием Markdown
        await tempBot.telegram.sendMessage(telegramId, message, { parse_mode: 'Markdown' });
      } catch (markdownError) {
        console.error('Ошибка при отправке сообщения с Markdown, пробуем без форматирования:', markdownError);
        // Если возникла ошибка с Markdown, отправляем без форматирования
        await tempBot.telegram.sendMessage(telegramId, message);
      }
    } else {
      // Отправляем обычное сообщение
      await tempBot.telegram.sendMessage(telegramId, message);
    }

    console.log(`Сообщение успешно отправлено пользователю ${telegramId}`);
    return true;
  } catch (error) {
    console.error(`Ошибка при отправке сообщения пользователю ${telegramId}:`, error);
    return false;
  }
};

/**
 * Отправляет уведомление о смене роли пользователю
 * @param {string} telegramId - Telegram ID пользователя
 * @param {string} roleName - Название новой роли
 * @param {number|null} durationMonths - Срок действия роли в месяцах (только для VIP)
 * @returns {Promise<boolean>} - Результат отправки уведомления
 */
const sendRoleChangeNotification = async (telegramId, roleName, durationMonths = null) => {
  try {
    const roleEmoji = {
      'BASIC': '👤',
      'VIP': '⭐',
      'ADMIN': '🛡️',
      'CEO': '👑'
    };

    const emoji = roleEmoji[roleName] || '🔄';

    let message = `${emoji} *Ваша роль в FL Hub была изменена!*\n\n` +
                 `Новая роль: *${roleName}*\n\n`;

    // Добавляем информацию о сроке действия для VIP
    if (roleName === 'VIP' && durationMonths) {
      // Вычисляем дату окончания срока действия
      const now = new Date();
      const expiryDate = new Date(now);
      expiryDate.setMonth(now.getMonth() + parseInt(durationMonths));

      // Форматируем дату
      const formattedDate = expiryDate.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

      message += `Срок действия: *${durationMonths} мес.* (до ${formattedDate})\n\n`;
    }

    message += `_Это изменение вступит в силу при следующем входе в приложение._`;

    return await sendMessageToUser(telegramId, message, true);
  } catch (error) {
    console.error(`Ошибка при отправке уведомления о смене роли пользователю ${telegramId}:`, error);
    return false;
  }
};

module.exports = {
  sendMessageToUser,
  sendRoleChangeNotification
};
