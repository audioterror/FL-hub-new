-- Добавление новых полей в таблицу tg_users
ALTER TABLE tg_users
ADD COLUMN IF NOT EXISTS status VARCHAR(100),
ADD COLUMN IF NOT EXISTS birth_date VARCHAR(20),
ADD COLUMN IF NOT EXISTS photo_url VARCHAR(255);
