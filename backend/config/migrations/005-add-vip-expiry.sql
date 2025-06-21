-- Добавление поля для хранения срока действия VIP-роли
ALTER TABLE tg_users
ADD COLUMN IF NOT EXISTS vip_expires_at TIMESTAMP;

-- Создание индекса для быстрого поиска пользователей с истекшим VIP
CREATE INDEX IF NOT EXISTS idx_tg_users_vip_expires_at ON tg_users(vip_expires_at);

-- Комментарий к миграции
COMMENT ON COLUMN tg_users.vip_expires_at IS 'Дата и время истечения VIP-статуса пользователя. NULL означает, что срок не ограничен или роль не VIP.';
