const { pool } = require('../config/db');

class Role {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
  }

  // Получить все роли
  static async getAll() {
    try {
      console.log('Attempting to get all roles from database...');
      const result = await pool.query('SELECT * FROM roles ORDER BY id');
      console.log('Roles retrieved successfully:', result.rows);
      return result.rows.map(row => new Role(row));
    } catch (error) {
      console.error('Error getting all roles:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }

  // Получить роль по ID
  static async getById(id) {
    try {
      const result = await pool.query('SELECT * FROM roles WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        return null;
      }
      return new Role(result.rows[0]);
    } catch (error) {
      console.error(`Error getting role by ID ${id}:`, error);
      throw error;
    }
  }

  // Получить роль по имени
  static async getByName(name) {
    try {
      const result = await pool.query('SELECT * FROM roles WHERE name = $1', [name]);
      if (result.rows.length === 0) {
        return null;
      }
      return new Role(result.rows[0]);
    } catch (error) {
      console.error(`Error getting role by name ${name}:`, error);
      throw error;
    }
  }

  // Получить ID роли BASIC (для использования по умолчанию)
  static async getBasicRoleId() {
    try {
      const result = await pool.query('SELECT id FROM roles WHERE name = $1', ['BASIC']);
      if (result.rows.length === 0) {
        throw new Error('Basic role not found');
      }
      return result.rows[0].id;
    } catch (error) {
      console.error('Error getting basic role ID:', error);
      throw error;
    }
  }
}

module.exports = Role;
