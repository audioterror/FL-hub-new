import axios from 'axios';
import { API_URL } from '../config';

/**
 * Получение списка пользователей
 * @returns {Promise<Array>} Список пользователей
 */
export const getUsersList = async () => {
  try {
    // Получаем токен из localStorage
    const authToken = localStorage.getItem('authToken');

    if (!authToken) {
      throw new Error('Не авторизован');
    }

    // Отправляем запрос на получение списка пользователей
    const response = await axios.get(`${API_URL}/users`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching users list:', error);
    throw error;
  }
};

/**
 * Обновление роли пользователя
 * @param {number} userId - ID пользователя
 * @param {string} role - Новая роль пользователя
 * @param {number|null} durationMonths - Срок действия роли в месяцах (только для VIP)
 * @returns {Promise<Object>} Обновленный пользователь
 */
export const updateUserRole = async (userId, role, durationMonths = null) => {
  try {
    // Получаем токен из localStorage
    const authToken = localStorage.getItem('authToken');

    if (!authToken) {
      throw new Error('Не авторизован');
    }

    // Формируем данные для запроса
    const requestData = { role_name: role };

    // Если указан срок действия, добавляем его в запрос
    if (durationMonths !== null) {
      requestData.duration_months = durationMonths;
    }

    console.log(`Updating user ${userId} role to ${role}${durationMonths ? ` for ${durationMonths} months` : ''}`);

    // Отправляем запрос на обновление роли пользователя
    const response = await axios.patch(
      `${API_URL}/users/${userId}/role`,
      requestData,
      {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

/**
 * Удаление пользователя
 * @param {number} userId - ID пользователя
 * @returns {Promise<void>}
 */
export const deleteUser = async (userId) => {
  try {
    // Получаем токен из localStorage
    const authToken = localStorage.getItem('authToken');

    if (!authToken) {
      throw new Error('Не авторизован');
    }

    // Отправляем запрос на удаление пользователя
    await axios.delete(`${API_URL}/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

/**
 * Получение статистики пользователей
 * @param {Array} users - Список пользователей
 * @returns {Object} Статистика пользователей
 */
export const getUsersStats = (users) => {
  // Инициализируем счетчики
  const stats = {
    total: users.length,
    basic: 0,
    vip: 0,
    admin: 0,
    ceo: 0
  };

  // Подсчитываем количество пользователей по ролям
  users.forEach(user => {
    switch (user.role_name) {
      case 'BASIC':
        stats.basic++;
        break;
      case 'VIP':
        stats.vip++;
        break;
      case 'ADMIN':
        stats.admin++;
        break;
      case 'CEO':
        stats.ceo++;
        break;
      default:
        // Если роль не определена, считаем как BASIC
        stats.basic++;
    }
  });

  return stats;
};
