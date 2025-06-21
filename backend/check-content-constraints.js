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

async function checkContentConstraints() {
  const client = await pool.connect();
  
  try {
    // Получаем информацию о ограничениях таблицы content
    const result = await client.query(`
      SELECT con.conname as constraint_name,
             pg_get_constraintdef(con.oid) as constraint_definition
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
      WHERE rel.relname = 'content'
    `);
    
    console.log('Ограничения таблицы content:');
    console.table(result.rows);
    
    // Получаем уникальные значения типов контента
    const typesResult = await client.query(`
      SELECT DISTINCT type FROM content
    `);
    
    console.log('\nДоступные типы контента:');
    console.table(typesResult.rows);
  } catch (error) {
    console.error('Ошибка при проверке ограничений таблицы content:', error);
  } finally {
    client.release();
    pool.end();
  }
}

// Запускаем функцию
checkContentConstraints();
