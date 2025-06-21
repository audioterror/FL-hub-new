const { pool } = require('../config/db');
const User = require('./User');
const ContentExample = require('./ContentExample');
const path = require('path');
const { getFileUrl } = require('../services/storageService');

class Content {
  constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.type = data.type;
    this.description = data.description;
    this.file_path = data.file_path;
    this.uploaded_by = data.uploaded_by;
    this.created_at = data.created_at;
    this.size = data.size;
    this.compatibility = data.compatibility;
    this.cover_image = data.cover_image;
    this._uploader = null; // Для кеширования данных загрузившего пользователя
  }

  // Получить пользователя, загрузившего контент
  async getUploader() {
    if (!this._uploader && this.uploaded_by) {
      this._uploader = await User.getById(this.uploaded_by);
    }
    return this._uploader;
  }

  // Получить примеры контента
  async getExamples() {
    try {
      return await ContentExample.getAllByContentId(this.id);
    } catch (error) {
      console.error(`Error getting examples for content ID ${this.id}:`, error);
      return [];
    }
  }

  // Получить все элементы контента
  static async getAll(type = null) {
    try {
      let query = 'SELECT * FROM content';
      const params = [];

      // Если указан тип, фильтруем по нему
      if (type) {
        query += ' WHERE type = $1';
        params.push(type);
      }

      query += ' ORDER BY created_at DESC';

      const result = await pool.query(query, params);
      return result.rows.map(row => new Content(row));
    } catch (error) {
      console.error('Error getting all content:', error);
      throw error;
    }
  }

  // Получить элемент контента по ID
  static async getById(id) {
    try {
      const result = await pool.query('SELECT * FROM content WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        return null;
      }
      return new Content(result.rows[0]);
    } catch (error) {
      console.error(`Error getting content by ID ${id}:`, error);
      throw error;
    }
  }

  // Создать новый элемент контента
  static async create(contentData) {
    try {
      const result = await pool.query(
        `INSERT INTO content (
          title, type, description, file_path, uploaded_by, size, compatibility, cover_image
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          contentData.title,
          contentData.type,
          contentData.description || null,
          contentData.file_path,
          contentData.uploaded_by,
          contentData.size || null,
          contentData.compatibility || null,
          contentData.cover_image || null
        ]
      );

      return new Content(result.rows[0]);
    } catch (error) {
      console.error('Error creating content:', error);
      throw error;
    }
  }

  // Удалить элемент контента
  static async delete(id) {
    try {
      const result = await pool.query('DELETE FROM content WHERE id = $1 RETURNING *', [id]);
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } catch (error) {
      console.error(`Error deleting content with ID ${id}:`, error);
      throw error;
    }
  }

  // Получить все типы контента
  static async getTypes() {
    try {
      const result = await pool.query('SELECT DISTINCT type FROM content ORDER BY type');
      return result.rows.map(row => row.type);
    } catch (error) {
      console.error('Error getting content types:', error);
      throw error;
    }
  }

  // Получить количество элементов контента по типу
  static async getCountByType(type) {
    try {
      const result = await pool.query('SELECT COUNT(*) FROM content WHERE type = $1', [type]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error(`Error getting content count for type ${type}:`, error);
      throw error;
    }
  }

  // Обновить элемент контента
  async update(updateData) {
    try {
      const result = await pool.query(
        `UPDATE content
        SET title = $1, description = $2, compatibility = $3, cover_image = $4
        WHERE id = $5
        RETURNING *`,
        [
          updateData.title || this.title,
          updateData.description !== undefined ? updateData.description : this.description,
          updateData.compatibility !== undefined ? updateData.compatibility : this.compatibility,
          updateData.cover_image !== undefined ? updateData.cover_image : this.cover_image,
          this.id
        ]
      );

      if (result.rows.length === 0) {
        throw new Error(`Content with ID ${this.id} not found`);
      }

      // Обновляем текущий объект
      Object.assign(this, new Content(result.rows[0]));

      return this;
    } catch (error) {
      console.error(`Error updating content with ID ${this.id}:`, error);
      throw error;
    }
  }

  // Увеличить счетчик скачиваний
  static async incrementDownloadsCount(id) {
    try {
      const result = await pool.query(
        `UPDATE content
         SET downloads_count = COALESCE(downloads_count, 0) + 1
         WHERE id = $1
         RETURNING *`,
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return new Content(result.rows[0]);
    } catch (error) {
      console.error(`Error incrementing downloads count for content ID ${id}:`, error);
      throw error;
    }
  }

  // Получить URL файла
  getFileUrl() {
    if (!this.file_path) {
      return null;
    }

    // Если путь уже является полным URL (из Object Storage)
    if (this.file_path.startsWith('http')) {
      return this.file_path;
    }

    // Для путей, начинающихся с /uploads
    if (this.file_path.startsWith('/uploads') || this.file_path.replace(/^\/+/, '').startsWith('uploads')) {
      return this.file_path.startsWith('/') ? this.file_path : `/${this.file_path}`;
    }

    // Для обратной совместимости со старыми путями
    return this.file_path.startsWith('/') ? `/api${this.file_path}` : `/api/${this.file_path}`;
  }

  // Получить абсолютный путь к файлу
  getAbsoluteFilePath() {
    if (!this.file_path) {
      return null;
    }

    // Если путь является URL из Object Storage, возвращаем null
    if (this.file_path.startsWith('http')) {
      return null;
    }

    // Если путь начинается с "/uploads/", убираем слеш в начале
    const relativePath = this.file_path.startsWith('/') ? this.file_path.substring(1) : this.file_path;

    return path.join(__dirname, '..', relativePath);
  }
}

module.exports = Content;
