// Скрипт для исправления роли CEO у пользователя
const { pool } = require('./config/db');

async function fixCeoRole() {
  try {
    console.log('Connecting to database...');
    
    // Получаем список всех пользователей с ролью CEO
    const usersResult = await pool.query(`
      SELECT u.id, u.telegram_id, u.telegram_username, u.first_name, u.last_name, r.name as role_name 
      FROM tg_users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE r.name = 'CEO'
      ORDER BY u.id
    `);
    
    console.log('Users with CEO role:');
    console.table(usersResult.rows);
    
    // Если найден пользователь @wlimax с ролью CEO, меняем его роль на BASIC
    const wlimaxUser = usersResult.rows.find(user => 
      user.telegram_username && user.telegram_username.toLowerCase() === 'wlimax'
    );
    
    if (wlimaxUser) {
      console.log(`Found user @${wlimaxUser.telegram_username} with CEO role. Changing role to BASIC...`);
      
      // Получаем ID роли BASIC
      const basicRoleResult = await pool.query(`SELECT id FROM roles WHERE name = 'BASIC'`);
      
      if (basicRoleResult.rows.length === 0) {
        throw new Error('BASIC role not found in database');
      }
      
      const basicRoleId = basicRoleResult.rows[0].id;
      
      // Обновляем роль пользователя
      await pool.query(
        `UPDATE tg_users SET role_id = $1 WHERE id = $2`,
        [basicRoleId, wlimaxUser.id]
      );
      
      console.log(`Successfully changed role for user @${wlimaxUser.telegram_username} from CEO to BASIC`);
      
      // Проверяем, что роль изменилась
      const updatedUserResult = await pool.query(`
        SELECT u.id, u.telegram_username, r.name as role_name 
        FROM tg_users u 
        JOIN roles r ON u.role_id = r.id 
        WHERE u.id = $1
      `, [wlimaxUser.id]);
      
      console.log('Updated user info:');
      console.table(updatedUserResult.rows);
    } else {
      console.log('User @wlimax with CEO role not found');
      
      // Выводим всех пользователей для проверки
      const allUsersResult = await pool.query(`
        SELECT u.id, u.telegram_id, u.telegram_username, u.first_name, u.last_name, r.name as role_name 
        FROM tg_users u 
        JOIN roles r ON u.role_id = r.id 
        ORDER BY u.id
      `);
      
      console.log('All users in database:');
      console.table(allUsersResult.rows);
    }
  } catch (error) {
    console.error('Error fixing CEO role:', error);
  } finally {
    // Закрываем соединение с базой данных
    await pool.end();
    console.log('Database connection closed');
  }
}

// Запускаем функцию
fixCeoRole();
