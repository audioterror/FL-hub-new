# Миграция авторизации FL Hub

## Обзор изменений

Система авторизации FL Hub была полностью переработана с Telegram авторизации на современную систему с поддержкой:

- **Email/Password авторизация** - классическая регистрация и вход по email
- **Google OAuth 2.0** - вход через аккаунт Google
- **Верификация email** - подтверждение email адреса после регистрации
- **Сброс пароля** - восстановление доступа через email

## Архитектура

### Backend изменения

#### 1. Новые поля в базе данных (миграция 008)
```sql
ALTER TABLE tg_users ADD COLUMN:
- email VARCHAR(255) UNIQUE
- password_hash VARCHAR(255)
- google_id VARCHAR(255) UNIQUE
- is_email_verified BOOLEAN DEFAULT FALSE
- email_verification_token VARCHAR(255)
- password_reset_token VARCHAR(255)
- password_reset_expires TIMESTAMP
```

#### 2. Новые зависимости
```bash
npm install bcryptjs passport passport-google-oauth20 passport-local nodemailer express-session
```

#### 3. Новые сервисы и конфигурации
- `backend/config/passport.js` - настройка Passport стратегий
- `backend/services/emailService.js` - сервис для отправки email
- Обновленная модель User с новыми методами авторизации
- Полностью переписанные маршруты авторизации в `backend/routes/auth.js`

### Frontend изменения

#### 1. Новые компоненты и страницы
- Обновленный `LoginPage.jsx` с табами для входа/регистрации
- `VerifyEmailPage.jsx` - страница верификации email
- `ResetPasswordPage.jsx` - страница сброса пароля
- `GoogleAuthSuccessPage.jsx` - обработка успешного Google OAuth
- `ProtectedRoute.jsx` - защита приватных маршрутов

#### 2. Обновленная система маршрутизации
- Использование React Router для SPA навигации
- Разделение на публичные и защищенные маршруты
- Обновленный AuthContext с новой логикой авторизации

## Настройка

### 1. Переменные окружения

Создайте файл `.env` в папке `backend/` на основе `env-example.txt`:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email сервис (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# JWT и сессии
JWT_SECRET=your-super-secret-jwt-key
SESSION_SECRET=your-super-secret-session-key

# Базовые настройки
FRONTEND_URL=http://localhost:5174
API_HOST=http://localhost:5000
```

### 2. Настройка Google OAuth

1. Создайте проект в [Google Cloud Console](https://console.cloud.google.com)
2. Включите Google+ API
3. Создайте OAuth 2.0 Client ID
4. Добавьте разрешенные redirect URLs:
   - `http://localhost:5000/auth/google/callback` (разработка)
   - `https://yourdomain.com/auth/google/callback` (продакшн)

### 3. Настройка Email сервиса

Для Gmail:
1. Включите 2FA в Google аккаунте
2. Создайте App Password для приложения
3. Используйте App Password в переменной `EMAIL_PASSWORD`

### 4. Запуск миграций

```bash
cd backend
node config/run-migrations.js
```

## API Endpoints

### Новые маршруты авторизации

#### POST `/api/auth/register`
Регистрация нового пользователя
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "Имя",
  "lastName": "Фамилия"
}
```

#### POST `/api/auth/login`
Вход по email/password
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### GET `/api/auth/google`
Перенаправление на Google OAuth

#### GET `/api/auth/google/callback`
Callback для Google OAuth

#### GET `/api/auth/verify-email/:token`
Верификация email адреса

#### POST `/api/auth/forgot-password`
Запрос сброса пароля
```json
{
  "email": "user@example.com"
}
```

#### POST `/api/auth/reset-password`
Сброс пароля
```json
{
  "token": "reset-token",
  "newPassword": "newpassword123"
}
```

#### GET `/api/auth/verify-token`
Проверка JWT токена
Headers: `Authorization: Bearer <token>`

## Frontend маршруты

- `/login` - страница входа/регистрации
- `/verify-email/:token` - верификация email
- `/reset-password/:token` - сброс пароля
- `/auth/google/success` - обработка Google OAuth
- `/*` - защищенные маршруты (требуют авторизации)

## Безопасность

### Хеширование паролей
- Используется bcryptjs с salt rounds = 12
- Пароли никогда не хранятся в открытом виде

### JWT токены
- Срок действия: 30 дней
- Содержат: userId, email, role
- Проверяются на каждом защищенном запросе

### Email токены
- Верификация email: без срока действия до использования
- Сброс пароля: 1 час
- Одноразовые токены (удаляются после использования)

### Валидация данных
- Email: регулярные выражения
- Пароли: минимум 6 символов
- CSRF защита через SameSite cookies

## Миграция данных

### Существующие пользователи
- Telegram пользователи остаются в системе
- `telegram_id` становится необязательным полем
- Возможность привязки email к существующему Telegram аккаунту

### Совместимость
- Старые Telegram токены перестают работать
- Пользователи должны зарегистрироваться заново или войти через Google
- Роли и VIP статусы сохраняются

## Удаленные функции

### Telegram интеграция
- ❌ Telegram Bot авторизация
- ❌ Автоматическое получение аватаров из Telegram
- ❌ Уведомления через Telegram бота
- ⚠️ Telegram конфигурация сохранена для возможного восстановления

### Устаревшие файлы
- `AuthToken.js` модель (заменена на JWT)
- Telegram авторизационные маршруты
- Старая логика проверки токенов

## Тестирование

### Локальная разработка
```bash
# Backend
cd backend
npm install
npm start

# Frontend
cd frontend
npm install
npm run dev
```

### Проверка функций
1. ✅ Регистрация через email
2. ✅ Вход через email/password
3. ✅ Вход через Google OAuth
4. ✅ Верификация email
5. ✅ Сброс пароля
6. ✅ Защищенные маршруты
7. ✅ JWT токены
8. ✅ Роли и права доступа

## Развертывание

### Продакшн настройки
1. Обновите переменные окружения для продакшн
2. Настройте HTTPS для Google OAuth
3. Обновите CORS настройки
4. Запустите миграции на продакшн базе
5. Настройте email сервис для продакшн

### Мониторинг
- Логирование ошибок авторизации
- Мониторинг неудачных попыток входа
- Отслеживание верификации email
- Метрики использования Google OAuth

## Поддержка

При возникновении проблем проверьте:
1. Переменные окружения
2. Доступность базы данных
3. Настройки Google OAuth
4. Настройки email сервиса
5. Логи backend приложения

## Откат

Для отката к Telegram авторизации:
1. Восстановите старые файлы из git истории
2. Откатите миграции базы данных
3. Восстановите старые переменные окружения
4. Перезапустите приложение

**Внимание**: После отката пользователи, зарегистрированные через email/Google, потеряют доступ к системе. 