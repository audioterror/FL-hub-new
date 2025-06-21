// Скрипт для понижения роли пользователя с CEO до BASIC
require('dotenv').config();
const { pool } = require('./config/db');

async function demoteCEO() {
  try {
    console.log('Connecting to database...');
    console.log('Database settings:');
    console.log('Host:', process.env.DB_HOST);
    console.log('Port:', process.env.DB_PORT);
    console.log('User:', process.env.DB_USER);
    console.log('Database:', process.env.DB_NAME);
    
    // Получаем список всех пользователей
    console.log('Getting all users...');
    const allUsersResult = await pool.query(`
      SELECT u.id, u.telegram_id, u.telegram_username, u.first_name, u.last_name, r.name as role_name 
      FROM tg_users u 
      JOIN roles r ON u.role_id = r.id 
      ORDER BY u.id
    `);
    
    console.log('All users in database:');
    console.table(allUsersResult.rows);
    
    // Ищем пользователя @wlimax
    const wlimaxUser = allUsersResult.rows.find(user => 
      user.telegram_username && user.telegram_username.toLowerCase() === 'wlimax'
    );
    
    if (!wlimaxUser) {
      console.log('User @wlimax not found in database');
      return;
    }
    
    console.log('Found user @wlimax:');
    console.log(wlimaxUser);
    
    // Если у пользователя роль CEO, меняем на BASIC
    if (wlimaxUser.role_name === 'CEO') {
      console.log('User @wlimax has CEO role. Changing to BASIC...');
      
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
      console.log(`User @${wlimaxUser.telegram_username} already has role ${wlimaxUser.role_name}`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Закрываем соединение с базой данных
    await pool.end();
    console.log('Database connection closed');
  }
}

// Запускаем функцию
demoteCEO();
