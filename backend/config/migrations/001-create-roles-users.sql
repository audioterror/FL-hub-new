-- Создание таблицы ролей
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL
);

-- Вставка предопределенных ролей
INSERT INTO roles (name) VALUES
  ('BASIC'),
  ('VIP'),
  ('ADMIN'),
  ('CEO')
ON CONFLICT (name) DO NOTHING;

-- Создание новой таблицы пользователей с префиксом tg_
CREATE TABLE IF NOT EXISTS tg_users (
  id SERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  telegram_username VARCHAR(100),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role_id INT REFERENCES roles(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Получаем ID роли BASIC и устанавливаем его как значение по умолчанию
DO $$
DECLARE
  basic_role_id INT;
BEGIN
  SELECT id INTO basic_role_id FROM roles WHERE name = 'BASIC';
  EXECUTE format('ALTER TABLE tg_users ALTER COLUMN role_id SET DEFAULT %s', basic_role_id);
END $$;

-- Создание индекса для быстрого поиска по telegram_id
CREATE INDEX IF NOT EXISTS idx_tg_users_telegram_id ON tg_users(telegram_id);

-- Создание тестового администратора
INSERT INTO tg_users (telegram_id, telegram_username, first_name, last_name, role_id)
VALUES (
  123456789, -- Заглушка для telegram_id
  'admin_test',
  'Admin',
  'Test',
  (SELECT id FROM roles WHERE name = 'ADMIN')
)
ON CONFLICT (telegram_id) DO NOTHING;
