const { pool } = require('../config/db');
const User = require('./User');

class News {
  constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.subtitle = data.subtitle;
    this.content = data.content;
    this.image_url = data.image_url;
    this.video_url = data.video_url;
    this.media_url = data.media_url;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    this.author_id = data.author_id;
    this._author = null; // Для кеширования автора
  }

  // Получить автора новости
  async getAuthor() {
    if (!this._author && this.author_id) {
      this._author = await User.getById(this.author_id);
    }
    return this._author;
  }

  // Получить все новости с пагинацией
  static async getAll(page = 1, limit = 10) {
    try {
      // Проверяем, существует ли таблица news
      const tableExists = await News.checkTableExists();
      if (!tableExists) {
        console.log('News table does not exist');
        return [];
      }

      const offset = (page - 1) * limit;
      const result = await pool.query(
        `SELECT * FROM news ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
      return result.rows.map(row => new News(row));
    } catch (error) {
      console.error('Error getting all news:', error);
      // Возвращаем пустой массив вместо ошибки
      return [];
    }
  }

  // Получить общее количество новостей
  static async getCount() {
    try {
      // Проверяем, существует ли таблица news
      const tableExists = await News.checkTableExists();
      if (!tableExists) {
        console.log('News table does not exist');
        return 0;
      }

      const result = await pool.query('SELECT COUNT(*) FROM news');
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error getting news count:', error);
      // Возвращаем 0 вместо ошибки
      return 0;
    }
  }

  // Проверить, существует ли таблица news
  static async checkTableExists() {
    try {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'news'
        );
      `);
      return result.rows[0].exists;
    } catch (error) {
      console.error('Error checking if news table exists:', error);
      return false;
    }
  }

  // Получить новость по ID
  static async getById(id) {
    try {
      // Проверяем, существует ли таблица news
      const tableExists = await News.checkTableExists();
      if (!tableExists) {
        console.log('News table does not exist');
        return null;
      }

      const result = await pool.query('SELECT * FROM news WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        return null;
      }
      return new News(result.rows[0]);
    } catch (error) {
      console.error(`Error getting news by ID ${id}:`, error);
      return null;
    }
  }

  // Создать новую новость
  static async create(newsData) {
    try {
      const result = await pool.query(
        `INSERT INTO news (
          title, subtitle, content, image_url, video_url, media_url, author_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          newsData.title,
          newsData.subtitle || null,
          newsData.content || null,
          newsData.image_url || null,
          newsData.video_url || null,
          newsData.media_url || null,
          newsData.author_id || null
        ]
      );

      return new News(result.rows[0]);
    } catch (error) {
      console.error('Error creating news:', error);
      throw error;
    }
  }

  // Статический метод для обновления новости
  static async update(id, newsData) {
    try {
      const fields = [];
      const values = [];
      let paramIndex = 1;

      // Добавляем поля, которые нужно обновить
      if (newsData.title !== undefined) {
        fields.push(`title = $${paramIndex++}`);
        values.push(newsData.title);
      }

      if (newsData.subtitle !== undefined) {
        fields.push(`subtitle = $${paramIndex++}`);
        values.push(newsData.subtitle);
      }

      if (newsData.content !== undefined) {
        fields.push(`content = $${paramIndex++}`);
        values.push(newsData.content);
      }

      if (newsData.image_url !== undefined) {
        fields.push(`image_url = $${paramIndex++}`);
        values.push(newsData.image_url);
      }

      if (newsData.video_url !== undefined) {
        fields.push(`video_url = $${paramIndex++}`);
        values.push(newsData.video_url);
      }

      if (newsData.media_url !== undefined) {
        fields.push(`media_url = $${paramIndex++}`);
        values.push(newsData.media_url);
      }

      // Добавляем обновление времени
      fields.push(`updated_at = CURRENT_TIMESTAMP`);

      // Если нет полей для обновления, возвращаем текущую новость
      if (fields.length === 0) {
        return await News.getById(id);
      }

      // Добавляем ID в массив значений
      values.push(id);

      // Формируем запрос
      const query = `
        UPDATE news
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        return null;
      }

      return new News(result.rows[0]);
    } catch (error) {
      console.error(`Error updating news with ID ${id}:`, error);
      throw error;
    }
  }

  // Удалить новость
  static async delete(id) {
    try {
      const result = await pool.query('DELETE FROM news WHERE id = $1 RETURNING *', [id]);
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } catch (error) {
      console.error(`Error deleting news with ID ${id}:`, error);
      throw error;
    }
  }

  // Обновить новость (instance method)
  async update(newsData) {
    try {
      const result = await pool.query(
        `UPDATE news
         SET title = $1, subtitle = $2, content = $3,
             image_url = $4, video_url = $5, media_url = $6, updated_at = CURRENT_TIMESTAMP
         WHERE id = $7
         RETURNING *`,
        [
          newsData.title !== undefined ? newsData.title : this.title,
          newsData.subtitle !== undefined ? newsData.subtitle : this.subtitle,
          newsData.content !== undefined ? newsData.content : this.content,
          newsData.image_url !== undefined ? newsData.image_url : this.image_url,
          newsData.video_url !== undefined ? newsData.video_url : this.video_url,
          newsData.media_url !== undefined ? newsData.media_url : this.media_url,
          this.id
        ]
      );

      if (result.rows.length === 0) {
        throw new Error(`News with ID ${this.id} not found`);
      }

      // Обновляем данные текущего объекта
      Object.assign(this, result.rows[0]);

      return this;
    } catch (error) {
      console.error(`Error updating news with ID ${this.id}:`, error);
      throw error;
    }
  }

  // Удалить новость (instance method)
  async delete() {
    try {
      const result = await pool.query('DELETE FROM news WHERE id = $1 RETURNING *', [this.id]);
      if (result.rows.length === 0) {
        throw new Error(`News with ID ${this.id} not found`);
      }
      return true;
    } catch (error) {
      console.error(`Error deleting news with ID ${this.id}:`, error);
      throw error;
    }
  }
}

module.exports = News;
