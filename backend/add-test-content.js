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

async function addTestContent() {
  const client = await pool.connect();

  try {
    // Проверяем, существует ли уже тестовый контент
    const checkResult = await client.query(
      'SELECT * FROM content WHERE title = $1',
      ['Test File for Download']
    );

    if (checkResult.rows.length > 0) {
      console.log('Тестовый контент уже существует в базе данных.');
      console.log('ID контента:', checkResult.rows[0].id);
      return;
    }

    // Добавляем тестовый контент
    const result = await client.query(
      `INSERT INTO content (
        title,
        description,
        type,
        file_path,
        created_at,
        size,
        compatibility,
        downloads_count
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        'Test File for Download',
        'Тестовый файл для проверки скачивания с ограничением скорости',
        'Preset',
        '/uploads/test/testfile.dat',
        new Date(),
        5242880, // 5MB
        'Тестовый файл для всех версий',
        0
      ]
    );

    console.log('Тестовый контент успешно добавлен в базу данных.');
    console.log('ID контента:', result.rows[0].id);
  } catch (error) {
    console.error('Ошибка при добавлении тестового контента:', error);
  } finally {
    client.release();
    pool.end();
  }
}

// Запускаем функцию
addTestContent();
