const { pool } = require('../config/db');
const Role = require('./Role');
const bcrypt = require('bcryptjs');

class User {
  constructor(data) {
    this.id = data.id;
    this.telegram_id = data.telegram_id;
    this.telegram_username = data.telegram_username;
    this.first_name = data.first_name;
    this.last_name = data.last_name;
    this.email = data.email;
    this.password_hash = data.password_hash;
    this.google_id = data.google_id;
    this.is_email_verified = data.is_email_verified || false;
    this.email_verification_token = data.email_verification_token;
    this.password_reset_token = data.password_reset_token;
    this.password_reset_expires = data.password_reset_expires;
    this.role_id = data.role_id;
    this.created_at = data.created_at;
    this.status = data.status || null;
    this.birth_date = data.birth_date || null;
    this.photo_url = data.photo_url || null;
    this.vip_expires_at = data.vip_expires_at || null;
    this._role = null; // Для кеширования роли
  }

  // Получить роль пользователя
  async getRole() {
    if (!this._role) {
      this._role = await Role.getById(this.role_id);
    }
    return this._role;
  }

  // Проверить, имеет ли пользователь определенную роль
  async hasRole(roleName) {
    const role = await this.getRole();
    return role && role.name === roleName;
  }

  // Проверить, является ли пользователь администратором (ADMIN или CEO)
  async isAdmin() {
    const role = await this.getRole();
    return role && (role.name === 'ADMIN' || role.name === 'CEO');
  }

  // Проверить, является ли пользователь VIP
  async isVIP() {
    const role = await this.getRole();

    // ADMIN и CEO всегда имеют VIP-привилегии
    if (role && (role.name === 'ADMIN' || role.name === 'CEO')) {
      return true;
    }

    // Для роли VIP проверяем срок действия
    if (role && role.name === 'VIP') {
      // Если vip_expires_at не установлен, значит VIP бессрочный
      if (!this.vip_expires_at) {
        return true;
      }

      // Проверяем, не истек ли срок действия VIP
      const now = new Date();
      const expiryDate = new Date(this.vip_expires_at);

      return expiryDate > now;
    }

    return false;
  }

  // Проверить, истек ли срок действия VIP
  isVIPExpired() {
    if (!this.vip_expires_at) {
      return false; // Если срок не установлен, значит VIP бессрочный
    }

    const now = new Date();
    const expiryDate = new Date(this.vip_expires_at);

    return expiryDate <= now;
  }

  // Получить оставшееся время действия VIP в днях
  getVIPDaysLeft() {
    if (!this.vip_expires_at) {
      return Infinity; // Если срок не установлен, возвращаем бесконечность
    }

    const now = new Date();
    const expiryDate = new Date(this.vip_expires_at);

    // Если срок уже истек, возвращаем 0
    if (expiryDate <= now) {
      return 0;
    }

    // Вычисляем разницу в миллисекундах и переводим в дни
    const diffMs = expiryDate - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  // Получить всех пользователей
  static async getAll() {
    try {
      const result = await pool.query('SELECT * FROM tg_users ORDER BY id');
      return result.rows.map(row => new User(row));
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  // Получить пользователя по ID
  static async getById(id) {
    try {
      const result = await pool.query('SELECT * FROM tg_users WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        return null;
      }
      return new User(result.rows[0]);
    } catch (error) {
      console.error(`Error getting user by ID ${id}:`, error);
      throw error;
    }
  }

  // Получить пользователя по Telegram ID
  static async getByTelegramId(telegramId) {
    try {
      const result = await pool.query('SELECT * FROM tg_users WHERE telegram_id = $1', [telegramId]);
      if (result.rows.length === 0) {
        return null;
      }
      return new User(result.rows[0]);
    } catch (error) {
      console.error(`Error getting user by Telegram ID ${telegramId}:`, error);
      throw error;
    }
  }

  // Получить пользователя по email
  static async getByEmail(email) {
    try {
      const result = await pool.query('SELECT * FROM tg_users WHERE email = $1', [email]);
      if (result.rows.length === 0) {
        return null;
      }
      return new User(result.rows[0]);
    } catch (error) {
      console.error(`Error getting user by email ${email}:`, error);
      throw error;
    }
  }

  // Получить пользователя по Google ID
  static async getByGoogleId(googleId) {
    try {
      const result = await pool.query('SELECT * FROM tg_users WHERE google_id = $1', [googleId]);
      if (result.rows.length === 0) {
        return null;
      }
      return new User(result.rows[0]);
    } catch (error) {
      console.error(`Error getting user by Google ID ${googleId}:`, error);
      throw error;
    }
  }

  // Проверить пароль
  async verifyPassword(password) {
    try {
      if (!this.password_hash) {
        return false;
      }
      return await bcrypt.compare(password, this.password_hash);
    } catch (error) {
      console.error(`Error verifying password for user ${this.id}:`, error);
      return false;
    }
  }

  // Установить пароль
  async setPassword(password) {
    try {
      const saltRounds = 12;
      this.password_hash = await bcrypt.hash(password, saltRounds);
      
      const result = await pool.query(
        'UPDATE tg_users SET password_hash = $1 WHERE id = $2 RETURNING *',
        [this.password_hash, this.id]
      );
      
      if (result.rows.length === 0) {
        throw new Error(`User with ID ${this.id} not found`);
      }
      
      return true;
    } catch (error) {
      console.error(`Error setting password for user ${this.id}:`, error);
      throw error;
    }
  }

  // Создать токен сброса пароля
  async createPasswordResetToken() {
    try {
      const token = require('crypto').randomBytes(32).toString('hex');
      const expires = new Date();
      expires.setHours(expires.getHours() + 1); // Токен действует 1 час

      const result = await pool.query(
        'UPDATE tg_users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3 RETURNING *',
        [token, expires, this.id]
      );

      if (result.rows.length === 0) {
        throw new Error(`User with ID ${this.id} not found`);
      }

      this.password_reset_token = token;
      this.password_reset_expires = expires;

      return token;
    } catch (error) {
      console.error(`Error creating password reset token for user ${this.id}:`, error);
      throw error;
    }
  }

  // Проверить токен сброса пароля
  static async verifyPasswordResetToken(token) {
    try {
      const result = await pool.query(
        'SELECT * FROM tg_users WHERE password_reset_token = $1 AND password_reset_expires > NOW()',
        [token]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return new User(result.rows[0]);
    } catch (error) {
      console.error(`Error verifying password reset token ${token}:`, error);
      throw error;
    }
  }

  // Сбросить пароль
  async resetPassword(newPassword) {
    try {
      await this.setPassword(newPassword);
      
      // Очищаем токен сброса пароля
      await pool.query(
        'UPDATE tg_users SET password_reset_token = NULL, password_reset_expires = NULL WHERE id = $1',
        [this.id]
      );

      this.password_reset_token = null;
      this.password_reset_expires = null;

      return true;
    } catch (error) {
      console.error(`Error resetting password for user ${this.id}:`, error);
      throw error;
    }
  }

  // Создать нового пользователя
  static async create(userData) {
    try {
      // Если role_id не указан, используем BASIC роль по умолчанию
      if (!userData.role_id) {
        userData.role_id = await Role.getBasicRoleId();
      }

      // Проверяем, является ли роль VIP и установлен ли срок действия
      let vipExpiresAt = null;
      if (userData.role_id) {
        const role = await Role.getById(userData.role_id);
        if (role && role.name === 'VIP' && userData.vip_expires_at) {
          vipExpiresAt = userData.vip_expires_at;
        }
      }

      // Хешируем пароль, если он предоставлен
      let passwordHash = null;
      if (userData.password) {
        const saltRounds = 12;
        passwordHash = await bcrypt.hash(userData.password, saltRounds);
      }

      const result = await pool.query(
        `INSERT INTO tg_users (
          telegram_id, telegram_username, first_name, last_name, email, password_hash,
          google_id, is_email_verified, role_id, status, birth_date, photo_url, vip_expires_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING *`,
        [
          userData.telegram_id || null,
          userData.telegram_username || null,
          userData.first_name,
          userData.last_name,
          userData.email || null,
          passwordHash,
          userData.google_id || null,
          userData.is_email_verified || false,
          userData.role_id,
          userData.status || null,
          userData.birth_date || null,
          userData.photo_url || null,
          vipExpiresAt
        ]
      );

      return new User(result.rows[0]);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Обновить пользователя
  async update(userData) {
    try {
      // Проверяем, меняется ли роль на VIP и установлен ли срок действия
      let vipExpiresAt = this.vip_expires_at;

      if (userData.role_id !== undefined && userData.role_id !== this.role_id) {
        const newRole = await Role.getById(userData.role_id);

        // Если новая роль VIP и указан срок действия, обновляем его
        if (newRole && newRole.name === 'VIP') {
          if (userData.vip_expires_at !== undefined) {
            vipExpiresAt = userData.vip_expires_at;
          }
        } else {
          // Если новая роль не VIP, сбрасываем срок действия
          vipExpiresAt = null;
        }
      } else if (userData.vip_expires_at !== undefined) {
        // Если роль не меняется, но меняется срок действия
        vipExpiresAt = userData.vip_expires_at;
      }

      const result = await pool.query(
        `UPDATE tg_users
         SET telegram_username = $1, first_name = $2, last_name = $3, role_id = $4,
             status = $5, birth_date = $6, photo_url = $7, vip_expires_at = $8
         WHERE id = $9
         RETURNING *`,
        [
          userData.telegram_username !== undefined ? userData.telegram_username : this.telegram_username,
          userData.first_name !== undefined ? userData.first_name : this.first_name,
          userData.last_name !== undefined ? userData.last_name : this.last_name,
          userData.role_id !== undefined ? userData.role_id : this.role_id,
          userData.status !== undefined ? userData.status : this.status,
          userData.birth_date !== undefined ? userData.birth_date : this.birth_date,
          userData.photo_url !== undefined ? userData.photo_url : this.photo_url,
          vipExpiresAt,
          this.id
        ]
      );

      if (result.rows.length === 0) {
        throw new Error(`User with ID ${this.id} not found`);
      }

      // Обновляем данные текущего объекта
      Object.assign(this, result.rows[0]);
      this._role = null; // Сбрасываем кеш роли

      return this;
    } catch (error) {
      console.error(`Error updating user with ID ${this.id}:`, error);
      throw error;
    }
  }

  // Установить срок действия VIP
  async setVIPExpiry(months) {
    try {
      // Получаем текущую роль пользователя
      const role = await this.getRole();

      // Если роль не VIP, сначала меняем ее на VIP
      if (role && role.name !== 'VIP') {
        const vipRole = await Role.getByName('VIP');
        if (!vipRole) {
          throw new Error('VIP role not found');
        }

        this.role_id = vipRole.id;
      }

      // Вычисляем дату истечения срока действия
      const now = new Date();
      const expiryDate = new Date(now);
      expiryDate.setMonth(now.getMonth() + months);

      // Обновляем пользователя
      return await this.update({
        role_id: this.role_id,
        vip_expires_at: expiryDate
      });
    } catch (error) {
      console.error(`Error setting VIP expiry for user with ID ${this.id}:`, error);
      throw error;
    }
  }

  // Удалить пользователя
  async delete() {
    try {
      const result = await pool.query('DELETE FROM tg_users WHERE id = $1 RETURNING *', [this.id]);
      if (result.rows.length === 0) {
        throw new Error(`User with ID ${this.id} not found`);
      }
      return true;
    } catch (error) {
      console.error(`Error deleting user with ID ${this.id}:`, error);
      throw error;
    }
  }
}

module.exports = User;
