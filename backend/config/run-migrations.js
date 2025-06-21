const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

// Функция для запуска миграций
async function runMigrations() {
  try {
    console.log('Running migrations...');

    // Получаем список файлов миграций
    const migrationsDir = path.join(__dirname, '..', 'migrations');

    // Проверяем, существует ли директория
    if (!fs.existsSync(migrationsDir)) {
      console.log('Migrations directory not found.');
      return true;
    }

    // Получаем SQL-миграции
    const sqlMigrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Сортируем файлы по имени для последовательного выполнения

    // Получаем JS-миграции
    const jsMigrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js'))
      .sort();

    // Объединяем все миграции
    const migrationFiles = [...sqlMigrationFiles, ...jsMigrationFiles];

    if (migrationFiles.length === 0) {
      console.log('No migration files found.');
      return true;
    }

    // Подключаемся к базе данных
    const client = await pool.connect();

    try {
      // Создаем таблицу для отслеживания миграций, если она не существует
      await client.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) UNIQUE NOT NULL,
          applied_at TIMESTAMP DEFAULT NOW()
        );
      `);

      // Получаем список уже примененных миграций
      const { rows: appliedMigrations } = await client.query('SELECT name FROM migrations');
      const appliedMigrationNames = appliedMigrations.map(m => m.name);

      // Выполняем каждую миграцию, которая еще не была применена
      for (const file of migrationFiles) {
        if (appliedMigrationNames.includes(file)) {
          console.log(`Migration ${file} already applied, skipping.`);
          continue;
        }

        console.log(`Applying migration: ${file}`);

        // Выполняем миграцию в транзакции
        await client.query('BEGIN');
        try {
          if (file.endsWith('.sql')) {
            // Для SQL-миграций читаем содержимое файла и выполняем SQL-запрос
            const migrationSql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
            await client.query(migrationSql);
          } else if (file.endsWith('.js')) {
            // Для JS-миграций импортируем модуль и вызываем функцию up()
            const migration = require(path.join(migrationsDir, file));
            if (typeof migration.up === 'function') {
              await migration.up();
            } else {
              throw new Error(`Migration ${file} does not export an up() function`);
            }
          }

          await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
          await client.query('COMMIT');
          console.log(`Migration ${file} applied successfully.`);
        } catch (error) {
          await client.query('ROLLBACK');
          console.error(`Error applying migration ${file}:`, error.message);
          throw error;
        }
      }

      console.log('All migrations applied successfully!');
      return true;
    } finally {
      // Освобождаем клиента
      client.release();
    }
  } catch (error) {
    console.error('Error running migrations:', error.message);
    return false;
  }
}

// Если скрипт запущен напрямую
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Failed to run migrations:', error);
      process.exit(1);
    });
}

module.exports = { runMigrations };
