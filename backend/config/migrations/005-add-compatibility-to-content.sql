-- Добавление поля compatibility в таблицу content
ALTER TABLE content ADD COLUMN IF NOT EXISTS compatibility TEXT;
