require('dotenv').config();
const { Pool } = require('pg');

// Создаем подключение к базе данных
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function checkContentTable() {
  const client = await pool.connect();
  
  try {
    // Получаем информацию о структуре таблицы content
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'content'
    `);
    
    console.log('Структура таблицы content:');
    console.table(result.rows);
    
    // Получаем данные из таблицы content
    const contentResult = await client.query('SELECT * FROM content LIMIT 5');
    
    console.log('\nДанные из таблицы content:');
    console.log(contentResult.rows);
  } catch (error) {
    console.error('Ошибка при проверке таблицы content:', error);
  } finally {
    client.release();
    pool.end();
  }
}

// Запускаем функцию
checkContentTable();
