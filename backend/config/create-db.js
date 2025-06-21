const { Client } = require('pg');
require('dotenv').config();

async function createDatabase() {
  // Подключаемся к postgres (системная база данных)
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'postgres' // Подключаемся к системной базе данных
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    // Проверяем, существует ли база данных
    const checkResult = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [process.env.DB_NAME]
    );

    // Если база данных не существует, создаем ее
    if (checkResult.rowCount === 0) {
      console.log(`Database ${process.env.DB_NAME} does not exist, creating...`);
      // Используем template0 для избежания проблем с кодировкой
      await client.query(`CREATE DATABASE ${process.env.DB_NAME} TEMPLATE template0`);
      console.log(`Database ${process.env.DB_NAME} created successfully!`);
    } else {
      console.log(`Database ${process.env.DB_NAME} already exists`);
    }

    return true;
  } catch (error) {
    console.error('Error creating database:', error.message);
    return false;
  } finally {
    await client.end();
  }
}

// Если скрипт запущен напрямую
if (require.main === module) {
  createDatabase()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Failed to create database:', error);
      process.exit(1);
    });
}

module.exports = { createDatabase };
