/**
 * Миграция для добавления поля media_url в таблицу новостей
 */
const { pool } = require('../config/db');

/**
 * Добавление поля media_url в таблицу новостей
 */
async function up() {
  try {
    console.log('Добавление поля media_url в таблицу новостей...');
    
    // Проверяем, существует ли таблица
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'news'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('Таблица news не существует, пропускаем миграцию');
      return;
    }
    
    // Проверяем, существует ли поле media_url
    const columnExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'news'
        AND column_name = 'media_url'
      );
    `);
    
    if (columnExists.rows[0].exists) {
      console.log('Поле media_url уже существует, пропускаем создание');
      return;
    }
    
    // Добавляем поле media_url
    await pool.query(`
      ALTER TABLE news 
      ADD COLUMN media_url VARCHAR(255);
    `);
    
    console.log('Поле media_url успешно добавлено в таблицу news');
    
    return true;
  } catch (error) {
    console.error('Ошибка при добавлении поля media_url:', error);
    throw error;
  }
}

/**
 * Удаление поля media_url из таблицы новостей
 */
async function down() {
  try {
    console.log('Удаление поля media_url из таблицы новостей...');
    
    // Проверяем, существует ли таблица
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'news'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('Таблица news не существует, пропускаем миграцию');
      return;
    }
    
    // Удаляем поле media_url
    await pool.query(`
      ALTER TABLE news 
      DROP COLUMN IF EXISTS media_url;
    `);
    
    console.log('Поле media_url успешно удалено из таблицы news');
    
    return true;
  } catch (error) {
    console.error('Ошибка при удалении поля media_url:', error);
    throw error;
  }
}

module.exports = {
  up,
  down
}; 