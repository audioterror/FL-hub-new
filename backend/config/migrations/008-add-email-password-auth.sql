-- Добавляем поля для email/password авторизации
ALTER TABLE tg_users 
ADD COLUMN email VARCHAR(255) UNIQUE,
ADD COLUMN password_hash VARCHAR(255),
ADD COLUMN google_id VARCHAR(255) UNIQUE,
ADD COLUMN is_email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN email_verification_token VARCHAR(255),
ADD COLUMN password_reset_token VARCHAR(255),
ADD COLUMN password_reset_expires TIMESTAMP;

-- Создаем индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_users_email ON tg_users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON tg_users(google_id);

-- Делаем telegram_id необязательным (для пользователей, которые регистрируются через email)
ALTER TABLE tg_users ALTER COLUMN telegram_id DROP NOT NULL;

-- Добавляем ограничение: у пользователя должен быть либо telegram_id, либо email
ALTER TABLE tg_users ADD CONSTRAINT check_user_identity 
CHECK (telegram_id IS NOT NULL OR email IS NOT NULL);

-- Обновляем существующих пользователей: помечаем как verified тех, кто уже есть через Telegram
UPDATE tg_users SET is_email_verified = TRUE WHERE telegram_id IS NOT NULL; 