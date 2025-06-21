const { pool } = require('../config/db');
const crypto = require('crypto');

class AuthToken {
  constructor(data) {
    this.id = data.id;
    this.token = data.token;
    this.telegram_id = data.telegram_id;
    this.created_at = data.created_at;
    this.expires_at = data.expires_at;
    this.is_used = data.is_used;
  }

  // Генерировать новый токен авторизации
  static async generate() {
    try {
      console.log('Generating new auth token...');

      // Генерируем случайный токен
      const token = crypto.randomBytes(16).toString('hex');
      console.log('Generated token:', token);

      // Устанавливаем срок действия токена (30 минут)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30);
      console.log('Token expires at:', expiresAt);

      try {
        // Проверяем, существует ли таблица auth_tokens
        const tableCheck = await pool.query(
          `SELECT EXISTS (
             SELECT FROM information_schema.tables
             WHERE table_schema = 'public'
             AND table_name = 'auth_tokens'
           );`
        );

        const tableExists = tableCheck.rows[0].exists;
        console.log('Table auth_tokens exists:', tableExists);

        if (!tableExists) {
          console.error('Table auth_tokens does not exist!');

          // Создаем таблицу auth_tokens, если она не существует
          console.log('Creating auth_tokens table...');
          await pool.query(`
            CREATE TABLE IF NOT EXISTS auth_tokens (
              id SERIAL PRIMARY KEY,
              token VARCHAR(100) UNIQUE NOT NULL,
              telegram_id BIGINT,
              created_at TIMESTAMP DEFAULT NOW(),
              expires_at TIMESTAMP NOT NULL,
              is_used BOOLEAN DEFAULT FALSE
            );

            CREATE INDEX IF NOT EXISTS idx_auth_tokens_token ON auth_tokens(token);
            CREATE INDEX IF NOT EXISTS idx_auth_tokens_telegram_id ON auth_tokens(telegram_id);
          `);
          console.log('Table auth_tokens created successfully');
        }
      } catch (tableCheckError) {
        console.error('Error checking/creating auth_tokens table:', tableCheckError);
        // Продолжаем выполнение, так как таблица может существовать
      }

      // Сохраняем токен в базе данных
      console.log('Saving token to database...');
      try {
        const result = await pool.query(
          `INSERT INTO auth_tokens (token, expires_at)
           VALUES ($1, $2)
           RETURNING *`,
          [token, expiresAt]
        );

        console.log('Token saved successfully:', result.rows[0]);
        return new AuthToken(result.rows[0]);
      } catch (insertError) {
        console.error('Error inserting token into database:', insertError);

        // Проверяем, существует ли таблица auth_tokens
        try {
          const tableExists = await pool.query(
            `SELECT EXISTS (
               SELECT FROM information_schema.tables
               WHERE table_schema = 'public'
               AND table_name = 'auth_tokens'
             );`
          );
          console.log('Table auth_tokens exists check result:', tableExists.rows[0]);
        } catch (checkError) {
          console.error('Error checking if table exists:', checkError);
        }

        // Если произошла ошибка при вставке, возвращаем объект с токеном и сроком действия
        // Это позволит фронтенду продолжить работу даже при проблемах с базой данных
        return {
          token,
          expires_at: expiresAt,
          is_used: false
        };
      }
    } catch (error) {
      console.error('Error generating auth token:', error);

      // В случае ошибки возвращаем объект с токеном и сроком действия
      // Это позволит фронтенду продолжить работу даже при проблемах с базой данных
      const token = crypto.randomBytes(16).toString('hex');
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30);

      return {
        token,
        expires_at: expiresAt,
        is_used: false
      };
    }
  }

  // Активировать токен с помощью Telegram ID
  static async activate(token, telegramId) {
    try {
      console.log(`Activating token: ${token} for Telegram ID: ${telegramId}`);

      if (!token || token.trim() === '') {
        console.error('Token is empty or undefined');
        return null;
      }

      if (!telegramId) {
        console.error('Telegram ID is empty or undefined');
        return null;
      }

      try {
        // Проверяем, существует ли таблица auth_tokens
        const tableCheck = await pool.query(
          `SELECT EXISTS (
             SELECT FROM information_schema.tables
             WHERE table_schema = 'public'
             AND table_name = 'auth_tokens'
           );`
        );

        const tableExists = tableCheck.rows[0].exists;
        console.log('Table auth_tokens exists:', tableExists);

        if (!tableExists) {
          console.error('Table auth_tokens does not exist!');

          // Создаем таблицу auth_tokens, если она не существует
          console.log('Creating auth_tokens table...');
          await pool.query(`
            CREATE TABLE IF NOT EXISTS auth_tokens (
              id SERIAL PRIMARY KEY,
              token VARCHAR(100) UNIQUE NOT NULL,
              telegram_id BIGINT,
              created_at TIMESTAMP DEFAULT NOW(),
              expires_at TIMESTAMP NOT NULL,
              is_used BOOLEAN DEFAULT FALSE
            );

            CREATE INDEX IF NOT EXISTS idx_auth_tokens_token ON auth_tokens(token);
            CREATE INDEX IF NOT EXISTS idx_auth_tokens_telegram_id ON auth_tokens(telegram_id);
          `);
          console.log('Table auth_tokens created successfully');

          // Если таблица только что создана, токен не может существовать
          return null;
        }
      } catch (tableCheckError) {
        console.error('Error checking/creating auth_tokens table:', tableCheckError);
        // Продолжаем выполнение, так как таблица может существовать
      }

      // Проверяем, существует ли токен
      const checkResult = await pool.query(
        `SELECT * FROM auth_tokens WHERE token = $1`,
        [token]
      );

      if (checkResult.rows.length === 0) {
        console.log(`Token ${token} not found in database`);
        return null;
      }

      const tokenData = checkResult.rows[0];
      console.log('Found token:', tokenData);

      // Проверяем, не истек ли срок действия токена
      const now = new Date();
      const expiresAt = new Date(tokenData.expires_at);

      if (now > expiresAt) {
        console.log(`Token ${token} has expired. Expires at: ${expiresAt}, Current time: ${now}`);
        return null;
      }

      // Проверяем, не использован ли уже токен
      if (tokenData.is_used) {
        console.log(`Token ${token} is already used`);

        // Если токен уже использован этим же пользователем, считаем это успешной активацией
        if (tokenData.telegram_id === telegramId) {
          console.log(`Token ${token} is already used by this Telegram ID ${telegramId}`);
          return new AuthToken(tokenData);
        }

        return null;
      }

      // Активируем токен
      console.log(`Updating token ${token} with Telegram ID ${telegramId}`);
      const result = await pool.query(
        `UPDATE auth_tokens
         SET telegram_id = $1, is_used = true
         WHERE token = $2 AND expires_at > NOW() AND is_used = false
         RETURNING *`,
        [telegramId, token]
      );

      if (result.rows.length === 0) {
        console.log(`Failed to update token ${token}`);
        return null;
      }

      console.log(`Token ${token} successfully activated for Telegram ID ${telegramId}`);
      return new AuthToken(result.rows[0]);
    } catch (error) {
      console.error('Error activating auth token:', error);
      // Возвращаем null вместо выброса исключения, чтобы не прерывать работу бота
      return null;
    }
  }

  // Проверить, активирован ли токен
  static async check(token) {
    try {
      console.log(`Checking token: ${token}`);

      if (!token || token.trim() === '') {
        console.error('Token is empty or undefined');
        return null;
      }

      try {
        // Проверяем, существует ли таблица auth_tokens
        const tableCheck = await pool.query(
          `SELECT EXISTS (
             SELECT FROM information_schema.tables
             WHERE table_schema = 'public'
             AND table_name = 'auth_tokens'
           );`
        );

        const tableExists = tableCheck.rows[0].exists;
        console.log('Table auth_tokens exists:', tableExists);

        if (!tableExists) {
          console.error('Table auth_tokens does not exist!');
          return null;
        }
      } catch (tableCheckError) {
        console.error('Error checking auth_tokens table:', tableCheckError);
        // Продолжаем выполнение, так как таблица может существовать
      }

      const result = await pool.query(
        `SELECT * FROM auth_tokens
         WHERE token = $1 AND expires_at > NOW()`,
        [token]
      );

      if (result.rows.length === 0) {
        console.log(`Token ${token} not found or expired`);
        return null;
      }

      const tokenData = result.rows[0];
      console.log('Found token:', tokenData);

      return new AuthToken(tokenData);
    } catch (error) {
      console.error('Error checking auth token:', error);
      // Возвращаем null вместо выброса исключения
      return null;
    }
  }

  // Получить токен по ID
  static async getById(id) {
    try {
      const result = await pool.query('SELECT * FROM auth_tokens WHERE id = $1', [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return new AuthToken(result.rows[0]);
    } catch (error) {
      console.error(`Error getting auth token by ID ${id}:`, error);
      throw error;
    }
  }

  // Удалить устаревшие токены
  static async cleanupExpired() {
    try {
      const result = await pool.query(
        `DELETE FROM auth_tokens
         WHERE expires_at < NOW()
         RETURNING *`
      );

      console.log(`Cleaned up ${result.rows.length} expired auth tokens`);
      return result.rows.length;
    } catch (error) {
      console.error('Error cleaning up expired auth tokens:', error);
      throw error;
    }
  }
}

module.exports = AuthToken;
