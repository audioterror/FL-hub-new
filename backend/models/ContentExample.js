const { pool } = require('../config/db');

class ContentExample {
  constructor(data) {
    this.id = data.id;
    this.content_id = data.content_id;
    this.file_path = data.file_path;
    this.type = data.type;
    this.title = data.title;
    this.created_at = data.created_at;
    this.size = data.size;
  }

  // Получить все примеры для контента
  static async getAllByContentId(contentId) {
    try {
      const result = await pool.query(
        'SELECT * FROM content_examples WHERE content_id = $1 ORDER BY created_at DESC',
        [contentId]
      );
      return result.rows.map(row => new ContentExample(row));
    } catch (error) {
      console.error(`Error getting examples for content ID ${contentId}:`, error);
      throw error;
    }
  }

  // Получить пример по ID
  static async getById(id) {
    try {
      const result = await pool.query('SELECT * FROM content_examples WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        return null;
      }
      return new ContentExample(result.rows[0]);
    } catch (error) {
      console.error(`Error getting example with ID ${id}:`, error);
      throw error;
    }
  }

  // Создать новый пример
  static async create(exampleData) {
    try {
      const result = await pool.query(
        `INSERT INTO content_examples (
          content_id, file_path, type, title, size
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
        [
          exampleData.content_id,
          exampleData.file_path,
          exampleData.type,
          exampleData.title || null,
          exampleData.size || null
        ]
      );

      return new ContentExample(result.rows[0]);
    } catch (error) {
      console.error('Error creating content example:', error);
      throw error;
    }
  }

  // Удалить пример
  static async delete(id) {
    try {
      const result = await pool.query(
        'DELETE FROM content_examples WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return new ContentExample(result.rows[0]);
    } catch (error) {
      console.error(`Error deleting example with ID ${id}:`, error);
      throw error;
    }
  }

  // Обновить информацию о примере
  static async update(id, exampleData) {
    try {
      const fields = [];
      const values = [];
      let paramIndex = 1;

      // Добавляем поля, которые нужно обновить
      if (exampleData.title !== undefined) {
        fields.push(`title = $${paramIndex++}`);
        values.push(exampleData.title);
      }

      // Если нет полей для обновления, возвращаем текущий пример
      if (fields.length === 0) {
        return await ContentExample.getById(id);
      }

      // Добавляем ID в массив значений
      values.push(id);

      // Формируем запрос
      const query = `
        UPDATE content_examples
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }

      return new ContentExample(result.rows[0]);
    } catch (error) {
      console.error(`Error updating example with ID ${id}:`, error);
      throw error;
    }
  }
}

module.exports = ContentExample;
