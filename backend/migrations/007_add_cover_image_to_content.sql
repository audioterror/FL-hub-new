-- Добавление поля cover_image в таблицу content
ALTER TABLE content ADD COLUMN IF NOT EXISTS cover_image VARCHAR(255); 