-- Создание таблицы для хранения контента
CREATE TABLE IF NOT EXISTS content (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  description TEXT,
  file_path VARCHAR(255) NOT NULL,
  uploaded_by INTEGER REFERENCES tg_users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  size INTEGER
);

-- Добавляем проверку на тип контента
ALTER TABLE content ADD CONSTRAINT check_content_type 
  CHECK (type IN ('Preset', 'Plugin', 'Font', 'Sound', 'Footage', 'Script', 'Graphic', 'Pack'));

-- Создаем индекс для быстрого поиска по типу
CREATE INDEX IF NOT EXISTS idx_content_type ON content(type);

-- Создаем индекс для быстрого поиска по пользователю
CREATE INDEX IF NOT EXISTS idx_content_uploaded_by ON content(uploaded_by);
