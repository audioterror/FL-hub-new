const User = require('../models/User');
const Role = require('../models/Role');
const { sendRoleChangeNotification } = require('./messageService');
const { getUserProfilePhoto } = require('./telegramService');

class UserService {
  /**
   * Найти или создать пользователя по данным из Telegram
   * @param {Object} telegramData - Данные пользователя из Telegram
   * @param {number} telegramData.id - Telegram ID пользователя
   * @param {string} telegramData.username - Имя пользователя в Telegram (опционально)
   * @param {string} telegramData.first_name - Имя пользователя
   * @param {string} telegramData.last_name - Фамилия пользователя (опционально)
   * @returns {Promise<User>} - Объект пользователя
   */
  static async findOrCreateUserByTelegram(telegramData) {
    try {
      // Проверяем, существует ли пользователь с таким Telegram ID
      let user = await User.getByTelegramId(telegramData.id);

      // Если пользователь не найден, создаем нового
      if (!user) {
        // Получаем ID роли BASIC
        const basicRoleId = await Role.getBasicRoleId();

        // Создаем нового пользователя
        user = await User.create({
          telegram_id: telegramData.id,
          telegram_username: telegramData.username || null,
          first_name: telegramData.first_name,
          last_name: telegramData.last_name || null,
          role_id: basicRoleId
        });

        console.log(`Created new user with Telegram ID ${telegramData.id}`);
      } else {
        // Обновляем данные пользователя, если они изменились
        const needsUpdate = (
          (telegramData.username !== undefined && user.telegram_username !== telegramData.username) ||
          (telegramData.first_name !== undefined && user.first_name !== telegramData.first_name) ||
          (telegramData.last_name !== undefined && user.last_name !== telegramData.last_name)
        );

        if (needsUpdate) {
          await user.update({
            telegram_username: telegramData.username,
            first_name: telegramData.first_name,
            last_name: telegramData.last_name
          });

          console.log(`Updated user with Telegram ID ${telegramData.id}`);
        }
      }

      return user;
    } catch (error) {
      console.error('Error in findOrCreateUserByTelegram:', error);
      throw error;
    }
  }

  /**
   * Получить всех пользователей с информацией о ролях
   * @returns {Promise<Array>} - Массив пользователей с информацией о ролях
   */
  static async getAllUsersWithRoles() {
    try {
      const users = await User.getAll();

      // Получаем роли для каждого пользователя
      const usersWithRoles = await Promise.all(
        users.map(async (user) => {
          const role = await user.getRole();
          return {
            ...user,
            role_name: role ? role.name : null
          };
        })
      );

      return usersWithRoles;
    } catch (error) {
      console.error('Error getting all users with roles:', error);
      throw error;
    }
  }

  /**
   * Изменить роль пользователя
   * @param {number} userId - ID пользователя
   * @param {string} roleName - Название роли
   * @param {boolean} sendNotification - Отправлять ли уведомление пользователю (по умолчанию: true)
   * @returns {Promise<User>} - Обновленный объект пользователя
   */
  static async changeUserRole(userId, roleName, sendNotification = true) {
    try {
      // Получаем пользователя
      const user = await User.getById(userId);
      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }

      // Получаем текущую роль пользователя
      const currentRole = await user.getRole();
      const currentRoleName = currentRole ? currentRole.name : null;

      // Если роль не изменилась, просто возвращаем пользователя
      if (currentRoleName === roleName) {
        console.log(`User ${userId} already has role ${roleName}`);
        return user;
      }

      // Запрещаем изменение роли CEO
      if (currentRoleName === 'CEO') {
        console.log(`Cannot change role for user ${userId} because they have CEO role`);
        throw new Error('Cannot change role for users with CEO role');
      }

      // Запрещаем назначение роли CEO другим пользователям
      if (roleName === 'CEO') {
        console.log(`Cannot assign CEO role to user ${userId}`);
        throw new Error('Cannot assign CEO role to other users');
      }

      // Получаем роль по имени
      const role = await Role.getByName(roleName);
      if (!role) {
        throw new Error(`Role with name ${roleName} not found`);
      }

      // Обновляем роль пользователя
      await user.update({ role_id: role.id });

      console.log(`Changed role for user ${userId} from ${currentRoleName} to ${roleName}`);

      // Отправляем уведомление пользователю, если нужно
      if (sendNotification && user.telegram_id) {
        try {
          const notificationSent = await sendRoleChangeNotification(user.telegram_id, roleName);
          console.log(`Role change notification ${notificationSent ? 'sent' : 'failed'} for user ${userId}`);
        } catch (notificationError) {
          console.error(`Error sending role change notification to user ${userId}:`, notificationError);
          // Не прерываем выполнение функции из-за ошибки отправки уведомления
        }
      }

      return user;
    } catch (error) {
      console.error('Error changing user role:', error);
      throw error;
    }
  }
}

module.exports = UserService;
