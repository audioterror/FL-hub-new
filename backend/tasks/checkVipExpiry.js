/**
 * Задача для проверки срока действия VIP-статуса пользователей
 * и автоматического отката роли до BASIC по истечении срока
 */
const { pool } = require('../config/db');
const User = require('../models/User');
const Role = require('../models/Role');
const { sendMessageToUser } = require('../services/messageService');

/**
 * Проверяет и обновляет статусы пользователей с истекшим сроком VIP
 * @returns {Promise<number>} - Количество обновленных пользователей
 */
const checkVipExpiry = async () => {
  console.log('Запуск проверки срока действия VIP-статуса пользователей...');
  
  try {
    // Получаем текущую дату
    const now = new Date();
    
    // Получаем ID роли BASIC
    const basicRole = await Role.getByName('BASIC');
    if (!basicRole) {
      throw new Error('Роль BASIC не найдена в базе данных');
    }
    
    // Получаем ID роли VIP
    const vipRole = await Role.getByName('VIP');
    if (!vipRole) {
      throw new Error('Роль VIP не найдена в базе данных');
    }
    
    // Находим всех пользователей с ролью VIP и истекшим сроком действия
    const result = await pool.query(`
      SELECT * FROM tg_users 
      WHERE role_id = $1 
      AND vip_expires_at IS NOT NULL 
      AND vip_expires_at < $2
    `, [vipRole.id, now]);
    
    const expiredUsers = result.rows;
    console.log(`Найдено ${expiredUsers.length} пользователей с истекшим сроком действия VIP`);
    
    // Обновляем роли пользователей
    let updatedCount = 0;
    
    for (const userData of expiredUsers) {
      try {
        const user = new User(userData);
        
        // Обновляем роль пользователя на BASIC
        await user.update({
          role_id: basicRole.id,
          vip_expires_at: null
        });
        
        console.log(`Роль пользователя ${user.id} (${user.telegram_username || user.telegram_id}) изменена с VIP на BASIC`);
        updatedCount++;
        
        // Отправляем уведомление пользователю
        if (user.telegram_id) {
          try {
            const message = 
              '⚠️ *Срок действия VIP-статуса истек*\n\n' +
              'Ваш VIP-статус в FL Hub был автоматически изменен на BASIC в связи с истечением срока действия.\n\n' +
              'Для продления VIP-статуса, пожалуйста, оформите подписку в приложении.';
            
            await sendMessageToUser(user.telegram_id, message, true);
            console.log(`Уведомление об истечении срока VIP отправлено пользователю ${user.telegram_id}`);
          } catch (notificationError) {
            console.error(`Ошибка при отправке уведомления пользователю ${user.telegram_id}:`, notificationError);
          }
        }
      } catch (userError) {
        console.error(`Ошибка при обновлении пользователя ${userData.id}:`, userError);
      }
    }
    
    console.log(`Обновлено ${updatedCount} пользователей`);
    return updatedCount;
  } catch (error) {
    console.error('Ошибка при проверке срока действия VIP:', error);
    throw error;
  }
};

module.exports = {
  checkVipExpiry
};
