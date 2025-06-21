-- Создание таблицы токенов авторизации
CREATE TABLE IF NOT EXISTS auth_tokens (
  id SERIAL PRIMARY KEY,
  token VARCHAR(100) UNIQUE NOT NULL,
  telegram_id BIGINT,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  is_used BOOLEAN DEFAULT FALSE
);

-- Создание индекса для быстрого поиска по токену
CREATE INDEX IF NOT EXISTS idx_auth_tokens_token ON auth_tokens(token);

-- Создание индекса для быстрого поиска по telegram_id
CREATE INDEX IF NOT EXISTS idx_auth_tokens_telegram_id ON auth_tokens(telegram_id);
