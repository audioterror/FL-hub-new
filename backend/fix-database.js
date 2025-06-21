const { Pool } = require('pg');
require('dotenv').config();

async function fixDatabase() {
  console.log('Fixing database tables...');
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
    
    // Начинаем транзакцию
    await client.query('BEGIN');
    
    try {
      // Проверяем, существует ли таблица roles
      const rolesTableExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'roles'
        )
      `);
      
      if (!rolesTableExists.rows[0].exists) {
        console.log('Creating roles table...');
        
        // Создаем таблицу ролей
        await client.query(`
          CREATE TABLE roles (
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
        `);
        
        console.log('Roles table created and populated');
      } else {
        console.log('Roles table already exists');
        
        // Проверяем, есть ли записи в таблице roles
        const rolesCount = await client.query('SELECT COUNT(*) FROM roles');
        
        if (parseInt(rolesCount.rows[0].count) === 0) {
          console.log('Roles table is empty, inserting default roles...');
          
          // Вставляем предопределенные роли
          await client.query(`
            INSERT INTO roles (name) VALUES 
              ('BASIC'),
              ('VIP'),
              ('ADMIN'),
              ('CEO')
            ON CONFLICT (name) DO NOTHING
          `);
          
          console.log('Default roles inserted');
        } else {
          console.log('Roles table already has data');
          
          // Выводим список ролей
          const roles = await client.query('SELECT * FROM roles');
          console.log('Existing roles:');
          roles.rows.forEach(role => {
            console.log(`- ID: ${role.id}, Name: ${role.name}`);
          });
        }
      }
      
      // Проверяем, существует ли таблица tg_users
      const usersTableExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'tg_users'
        )
      `);
      
      if (!usersTableExists.rows[0].exists) {
        console.log('Creating tg_users table...');
        
        // Получаем ID роли BASIC
        const basicRole = await client.query("SELECT id FROM roles WHERE name = 'BASIC'");
        const basicRoleId = basicRole.rows[0].id;
        
        // Создаем таблицу пользователей
        await client.query(`
          CREATE TABLE tg_users (
            id SERIAL PRIMARY KEY,
            telegram_id BIGINT UNIQUE NOT NULL,
            telegram_username VARCHAR(100),
            first_name VARCHAR(100),
            last_name VARCHAR(100),
            role_id INT REFERENCES roles(id) DEFAULT ${basicRoleId},
            created_at TIMESTAMP DEFAULT NOW()
          )
        `);
        
        // Создаем индекс для быстрого поиска по telegram_id
        await client.query(`
          CREATE INDEX idx_tg_users_telegram_id ON tg_users(telegram_id)
        `);
        
        // Создаем тестового администратора
        const adminRole = await client.query("SELECT id FROM roles WHERE name = 'ADMIN'");
        const adminRoleId = adminRole.rows[0].id;
        
        await client.query(`
          INSERT INTO tg_users (telegram_id, telegram_username, first_name, last_name, role_id)
          VALUES (
            123456789,
            'admin_test',
            'Admin',
            'Test',
            ${adminRoleId}
          )
        `);
        
        console.log('tg_users table created and populated with test admin');
      } else {
        console.log('tg_users table already exists');
        
        // Проверяем, есть ли записи в таблице tg_users
        const usersCount = await client.query('SELECT COUNT(*) FROM tg_users');
        
        if (parseInt(usersCount.rows[0].count) === 0) {
          console.log('tg_users table is empty, inserting test admin...');
          
          // Получаем ID роли ADMIN
          const adminRole = await client.query("SELECT id FROM roles WHERE name = 'ADMIN'");
          const adminRoleId = adminRole.rows[0].id;
          
          // Создаем тестового администратора
          await client.query(`
            INSERT INTO tg_users (telegram_id, telegram_username, first_name, last_name, role_id)
            VALUES (
              123456789,
              'admin_test',
              'Admin',
              'Test',
              ${adminRoleId}
            )
            ON CONFLICT (telegram_id) DO NOTHING
          `);
          
          console.log('Test admin inserted');
        } else {
          console.log('tg_users table already has data');
          
          // Выводим список пользователей
          const users = await client.query('SELECT * FROM tg_users');
          console.log('Existing users:');
          users.rows.forEach(user => {
            console.log(`- ID: ${user.id}, Telegram ID: ${user.telegram_id}, Name: ${user.first_name} ${user.last_name}`);
          });
        }
      }
      
      // Фиксируем транзакцию
      await client.query('COMMIT');
      console.log('Database fix completed successfully');
    } catch (error) {
      // Откатываем транзакцию в случае ошибки
      await client.query('ROLLBACK');
      console.error('Error fixing database:', error.message);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error connecting to database:', error.message);
    console.error('Error details:', error);
  } finally {
    await pool.end();
  }
}

// Запускаем скрипт
fixDatabase()
  .then(() => {
    console.log('Database fix script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error in database fix script:', error);
    process.exit(1);
  });
