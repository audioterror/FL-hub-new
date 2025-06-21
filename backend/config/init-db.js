const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

// Функция для инициализации базы данных
async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    
    // Чтение SQL-скрипта
    const sqlScript = fs.readFileSync(path.join(__dirname, 'init-db.sql'), 'utf8');
    
    // Подключение к базе данных
    const client = await pool.connect();
    
    try {
      // Выполнение SQL-скрипта
      await client.query(sqlScript);
      console.log('Database initialized successfully!');
    } finally {
      // Освобождение клиента
      client.release();
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing database:', error.message);
    return false;
  }
}

// Если скрипт запущен напрямую
if (require.main === module) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Failed to initialize database:', error);
      process.exit(1);
    });
}

module.exports = { initializeDatabase };
