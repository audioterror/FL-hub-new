-- Создание таблицы для примеров контента
CREATE TABLE IF NOT EXISTS content_examples (
  id SERIAL PRIMARY KEY,
  content_id INTEGER NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  file_path VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'image' или 'video'
  title VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  size INTEGER
);
