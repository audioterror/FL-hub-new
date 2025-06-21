const { Pool } = require('pg');
require('dotenv').config();

async function checkDatabase() {
  console.log('Checking database connection and tables...');
  console.log('Database connection settings:');
  console.log('Host:', process.env.DB_HOST);
  console.log('Port:', process.env.DB_PORT);
  console.log('User:', process.env.DB_USER);
  console.log('Database:', process.env.DB_NAME);
  
  // Создаем пул подключений
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  
  try {
    // Подключаемся к базе данных
    console.log('Connecting to database...');
    const client = await pool.connect();
    console.log('Successfully connected to PostgreSQL database');
    
    // Проверяем текущую базу данных
    const dbResult = await client.query('SELECT current_database()');
    console.log('Current database:', dbResult.rows[0].current_database);
    
    // Проверяем текущую схему
    const schemaResult = await client.query('SHOW search_path');
    console.log('Current search path:', schemaResult.rows[0].search_path);
    
    // Проверяем список всех таблиц в публичной схеме
    console.log('Checking all tables in public schema...');
    const allTablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('All tables in public schema:');
    allTablesResult.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    // Проверяем, существуют ли наши таблицы
    console.log('Checking if our tables exist...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND 
            (table_name = 'roles' OR table_name = 'tg_users')
    `);
    
    console.log('Our tables in database:', tablesResult.rows.map(row => row.table_name));
    
    if (tablesResult.rows.length === 0) {
      console.warn('Warning: Tables "roles" and "tg_users" not found in schema "public"');
      
      // Создаем таблицы, если их нет
      console.log('Creating tables...');
      
      // Создаем таблицу ролей
      await client.query(`
        CREATE TABLE IF NOT EXISTS roles (
          id SERIAL PRIMARY KEY,
          name VARCHAR(50) UNIQUE NOT NULL
        )
      `);
      
      // Вставляем предопределенные роли
      await client.query(`
        INSERT INTO roles (name) VALUES 
          ('BASIC'),
          ('VIP'),
          ('ADMIN'),
          ('CEO')
        ON CONFLICT (name) DO NOTHING
      `);
      
      // Создаем таблицу пользователей
      await client.query(`
        CREATE TABLE IF NOT EXISTS tg_users (
          id SERIAL PRIMARY KEY,
          telegram_id BIGINT UNIQUE NOT NULL,
          telegram_username VARCHAR(100),
          first_name VARCHAR(100),
          last_name VARCHAR(100),
          role_id INT REFERENCES roles(id),
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      // Создаем индекс для быстрого поиска по telegram_id
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_tg_users_telegram_id ON tg_users(telegram_id)
      `);
      
      // Создаем тестового администратора
      await client.query(`
        INSERT INTO tg_users (telegram_id, telegram_username, first_name, last_name, role_id)
        VALUES (
          123456789,
          'admin_test',
          'Admin',
          'Test',
          (SELECT id FROM roles WHERE name = 'ADMIN')
        )
        ON CONFLICT (telegram_id) DO NOTHING
      `);
      
      console.log('Tables created successfully');
    } else {
      // Проверяем содержимое таблицы roles
      if (tablesResult.rows.some(row => row.table_name === 'roles')) {
        const rolesResult = await client.query('SELECT * FROM roles');
        console.log('Roles in database:');
        rolesResult.rows.forEach(role => {
          console.log(`- ID: ${role.id}, Name: ${role.name}`);
        });
        
        // Если таблица roles пуста, заполняем ее
        if (rolesResult.rows.length === 0) {
          console.log('Roles table is empty, inserting default roles...');
          await client.query(`
            INSERT INTO roles (name) VALUES 
              ('BASIC'),
              ('VIP'),
              ('ADMIN'),
              ('CEO')
            ON CONFLICT (name) DO NOTHING
          `);
          
          const updatedRolesResult = await client.query('SELECT * FROM roles');
          console.log('Updated roles in database:');
          updatedRolesResult.rows.forEach(role => {
            console.log(`- ID: ${role.id}, Name: ${role.name}`);
          });
        }
      }
      
      // Проверяем содержимое таблицы tg_users
      if (tablesResult.rows.some(row => row.table_name === 'tg_users')) {
        const usersResult = await client.query('SELECT * FROM tg_users');
        console.log('Users in database:');
        usersResult.rows.forEach(user => {
          console.log(`- ID: ${user.id}, Telegram ID: ${user.telegram_id}, Name: ${user.first_name} ${user.last_name}`);
        });
      }
    }
    
    // Проверяем права доступа
    console.log('Granting privileges on tables...');
    await client.query(`
      GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${process.env.DB_USER}
    `);
    
    console.log('Database check completed successfully');
    client.release();
  } catch (error) {
    console.error('Error checking database:', error.message);
    console.error('Error details:', error);
  } finally {
    await pool.end();
  }
}

// Запускаем проверку
checkDatabase()
  .then(() => {
    console.log('Database check script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error in database check script:', error);
    process.exit(1);
  });
