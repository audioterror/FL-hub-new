-- Скрипт для понижения роли пользователя с CEO до BASIC

-- Выводим всех пользователей
SELECT u.id, u.telegram_id, u.telegram_username, u.first_name, u.last_name, r.name as role_name 
FROM tg_users u 
JOIN roles r ON u.role_id = r.id 
ORDER BY u.id;

-- Обновляем роль пользователя @wlimax с CEO на BASIC
UPDATE tg_users 
SET role_id = (SELECT id FROM roles WHERE name = 'BASIC') 
WHERE telegram_username = 'wlimax' AND role_id = (SELECT id FROM roles WHERE name = 'CEO');

-- Проверяем, что роль изменилась
SELECT u.id, u.telegram_id, u.telegram_username, u.first_name, u.last_name, r.name as role_name 
FROM tg_users u 
JOIN roles r ON u.role_id = r.id 
WHERE u.telegram_username = 'wlimax';
