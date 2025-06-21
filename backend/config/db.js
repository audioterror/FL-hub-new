const { Pool } = require('pg');
require('dotenv').config();

// Выводим информацию о настройках подключения (без пароля)
console.log('Database connection settings:');
console.log('Host:', process.env.DB_HOST);
console.log('Port:', process.env.DB_PORT);
console.log('User:', process.env.DB_USER);
console.log('Database:', process.env.DB_NAME);

// Создаем конфигурацию для подключения к PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Функция для проверки подключения к базе данных
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to PostgreSQL database');

    // Проверяем, существуют ли таблицы
    try {
      const tablesResult = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public' AND
              (table_name = 'roles' OR table_name = 'tg_users')
      `);

      console.log('Tables in database:', tablesResult.rows.map(row => row.table_name));

      if (tablesResult.rows.length === 0) {
        console.warn('Warning: Tables "roles" and "tg_users" not found in schema "public"');
      } else {
        // Проверяем содержимое таблицы roles
        if (tablesResult.rows.some(row => row.table_name === 'roles')) {
          const rolesResult = await client.query('SELECT * FROM roles');
          console.log('Roles in database:', rolesResult.rows);
        }
      }
    } catch (tableError) {
      console.error('Error checking tables:', tableError.message);
    }

    client.release();
    return true;
  } catch (error) {
    console.error('Error connecting to PostgreSQL database:', error.message);
    console.error('Error details:', error);
    return false;
  }
};

module.exports = {
  pool,
  testConnection
};
