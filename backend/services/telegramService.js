const axios = require('axios');
require('dotenv').config();

// Получаем токен бота из переменных окружения
const botToken = process.env.TELEGRAM_BOT_TOKEN;

// Кеш для URL фотографий пользователей
// Ключ: telegram_id, значение: { url: string, timestamp: number }
const photoUrlCache = new Map();

/**
 * Получить информацию о пользователе Telegram
 * @param {number} telegramId - Telegram ID пользователя
 * @returns {Promise<Object>} - Информация о пользователе
 */
const getUserInfo = async (telegramId) => {
  try {
    const response = await axios.get(`https://api.telegram.org/bot${botToken}/getChat`, {
      params: {
        chat_id: telegramId
      }
    });

    if (response.data && response.data.ok) {
      return response.data.result;
    }

    return null;
  } catch (error) {
    console.error('Error getting user info from Telegram:', error.message);
    return null;
  }
};

/**
 * Получить URL фото профиля пользователя Telegram
 * @param {number} telegramId - Telegram ID пользователя
 * @param {boolean} forceRefresh - Принудительно обновить кеш
 * @returns {Promise<string|null>} - URL фото профиля или null, если фото не найдено
 */
const getUserProfilePhoto = async (telegramId, forceRefresh = false) => {
  // Проверяем кеш
  const cachedPhoto = photoUrlCache.get(telegramId);
  const now = Date.now();

  // Если есть в кеше и кеш не устарел (24 часа) и не требуется принудительное обновление
  if (cachedPhoto && !forceRefresh && (now - cachedPhoto.timestamp < 24 * 60 * 60 * 1000)) {
    return cachedPhoto.url;
  }

  try {
    // Сначала получаем список фотографий профиля пользователя
    const response = await axios.get(`https://api.telegram.org/bot${botToken}/getUserProfilePhotos`, {
      params: {
        user_id: telegramId,
        limit: 1
      }
    });

    if (response.data && response.data.ok && response.data.result.photos.length > 0) {
      // Берем первую (самую последнюю) фотографию
      const photo = response.data.result.photos[0][0]; // Берем самый большой размер

      // Получаем информацию о файле
      const fileResponse = await axios.get(`https://api.telegram.org/bot${botToken}/getFile`, {
        params: {
          file_id: photo.file_id
        }
      });

      if (fileResponse.data && fileResponse.data.ok) {
        // Формируем URL для загрузки файла
        const filePath = fileResponse.data.result.file_path;
        const photoUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;

        // Сохраняем в кеш
        photoUrlCache.set(telegramId, {
          url: photoUrl,
          timestamp: now
        });

        return photoUrl;
      }
    }

    // Если фото не найдено, сохраняем null в кеш
    photoUrlCache.set(telegramId, {
      url: null,
      timestamp: now
    });

    return null;
  } catch (error) {
    console.error('Error getting user profile photo from Telegram:', error.message);
    return null;
  }
};

/**
 * Отправить уведомление пользователю об изменении роли
 * @param {number} telegramId - Telegram ID пользователя
 * @param {string} roleName - Название новой роли
 * @returns {Promise<boolean>} - true, если уведомление отправлено успешно
 */
const sendRoleChangeNotification = async (telegramId, roleName) => {
  try {
    // Эмодзи для ролей
    const roleEmoji = {
      'BASIC': '👤',
      'VIP': '⭐',
      'ADMIN': '🛡️',
      'CEO': '👑'
    };

    // Формируем текст сообщения
    const emoji = roleEmoji[roleName] || '🔔';
    const message = `${emoji} <b>Изменение роли</b>\n\nВаша роль была изменена на <b>${roleName}</b>.\n\nТеперь вам доступны соответствующие привилегии в FL Hub.`;

    // Отправляем сообщение
    const response = await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      chat_id: telegramId,
      text: message,
      parse_mode: 'HTML'
    });

    return response.data && response.data.ok;
  } catch (error) {
    console.error('Error sending role change notification:', error.message);
    return false;
  }
};

/**
 * Отправить уведомление пользователю о подписке
 * @param {number} telegramId - Telegram ID пользователя
 * @param {Object} subscriptionInfo - Информация о подписке
 * @returns {Promise<boolean>} - true, если уведомление отправлено успешно
 */
const sendSubscriptionNotification = async (telegramId, subscriptionInfo) => {
  try {
    // Формируем текст сообщения
    const message = `⭐ <b>VIP-подписка активирована</b>\n\nВаша VIP-подписка на <b>${subscriptionInfo.plan}</b> успешно активирована!\n\nСрок действия: до <b>${subscriptionInfo.expiryDate}</b>\n\nТеперь вам доступны все преимущества VIP-пользователя в FL Hub.`;

    // Отправляем сообщение
    const response = await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      chat_id: telegramId,
      text: message,
      parse_mode: 'HTML'
    });

    return response.data && response.data.ok;
  } catch (error) {
    console.error('Error sending subscription notification:', error.message);
    return false;
  }
};

module.exports = {
  getUserInfo,
  getUserProfilePhoto,
  sendRoleChangeNotification,
  sendSubscriptionNotification
};
