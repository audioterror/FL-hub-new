/**
 * Миграция для создания таблицы новостей
 */
const { pool } = require('../config/db');

/**
 * Создание таблицы новостей
 */
async function up() {
  try {
    console.log('Создание таблицы новостей...');
    
    // Проверяем, существует ли таблица
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'news'
      );
    `);
    
    if (tableExists.rows[0].exists) {
      console.log('Таблица news уже существует, пропускаем создание');
      return;
    }
    
    // Создаем таблицу новостей
    await pool.query(`
      CREATE TABLE news (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        subtitle VARCHAR(255),
        content TEXT,
        image_url VARCHAR(255),
        video_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        author_id INTEGER REFERENCES tg_users(id) ON DELETE SET NULL
      );
    `);
    
    console.log('Таблица news успешно создана');
    
    // Создаем индекс для ускорения поиска
    await pool.query(`
      CREATE INDEX news_created_at_idx ON news(created_at DESC);
    `);
    
    console.log('Индекс для таблицы news успешно создан');
    
    return true;
  } catch (error) {
    console.error('Ошибка при создании таблицы новостей:', error);
    throw error;
  }
}

/**
 * Удаление таблицы новостей
 */
async function down() {
  try {
    console.log('Удаление таблицы новостей...');
    
    // Удаляем таблицу
    await pool.query(`DROP TABLE IF EXISTS news;`);
    
    console.log('Таблица news успешно удалена');
    
    return true;
  } catch (error) {
    console.error('Ошибка при удалении таблицы новостей:', error);
    throw error;
  }
}

module.exports = {
  up,
  down
};
