const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const passport = require('./config/passport');
const { testConnection } = require('./config/db');
const { runMigrations } = require('./config/run-migrations');
const { initBot } = require('./bot');
const { checkVipExpiry } = require('./tasks/checkVipExpiry');
const apiRoutes = require('./routes/api');
const usersRoutes = require('./routes/users');
const telegramRoutes = require('./routes/telegram');
const authRoutes = require('./routes/auth');
const contentRoutes = require('./routes/content');
const contentExamplesRoutes = require('./routes/contentExamples');
const subscriptionRoutes = require('./routes/subscription');
const newsRoutes = require('./routes/news');
require('dotenv').config();

// Создаем экземпляр Express приложения
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json({ limit: '1000mb' })); // Для парсинга JSON с увеличенным лимитом
app.use(express.urlencoded({ extended: true, limit: '1000mb' })); // Для парсинга URL-encoded данных с увеличенным лимитом

// Настройка сессий для Passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Инициализация Passport
app.use(passport.initialize());
app.use(passport.session());

// Статические файлы (локальное хранилище)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Настройка CORS
const productionHost = process.env.API_HOST ? new URL(process.env.API_HOST).host : null;
const allowedOrigins = [];

// Add production host if provided
if (productionHost) {
  allowedOrigins.push(`http://${productionHost}`, `https://${productionHost}`);
}

// Add additional origins from environment variable (comma separated)
if (process.env.ALLOWED_ORIGINS) {
  allowedOrigins.push(
    ...process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
  );
}

const corsOptions = {
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));

// Тестовый маршрут для проверки работы сервера
app.get('/ping', (req, res) => {
  res.json({ status: 'ok', message: 'pong' });
});

// Базовый маршрут API
app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to FL Hub API' });
});

// Сохраняем старый маршрут для совместимости
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', message: 'FL Hub API is running' });
});

// Подключаем маршруты API
app.use('/api', apiRoutes);

// Подключаем маршруты пользователей
app.use('/api/users', usersRoutes);

// Подключаем маршруты Telegram
app.use('/api/telegram', telegramRoutes);

// Подключаем маршруты авторизации
app.use('/api/auth', authRoutes);

// Подключаем маршруты контента
app.use('/api/content', contentRoutes);

// Подключаем маршруты примеров контента
app.use('/api/content-examples', contentExamplesRoutes);

// Подключаем маршруты подписки
app.use('/api/subscription', subscriptionRoutes);

// Подключаем маршруты новостей
app.use('/api/news', newsRoutes);

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Запуск сервера
const startServer = async () => {
  try {
    // Проверяем подключение к базе данных
    await testConnection();

    // Запускаем миграции
    console.log('Running database migrations...');
    await runMigrations();

    // Инициализируем Telegram бота
    try {
      console.log('Инициализация Telegram бота...');
      const botInitialized = initBot();
      console.log('Результат инициализации бота:', botInitialized ? 'успешно' : 'неудачно');
    } catch (botError) {
      console.error('Ошибка при инициализации Telegram бота:', botError);
    }

    // Запускаем сервер
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      
      const apiHost = process.env.API_HOST || `http://${productionHost || '0.0.0.0'}:${PORT}`;
      console.log(`API available at ${apiHost}/api`);

      // Запускаем задачу проверки срока действия VIP
      console.log('Запуск задачи проверки срока действия VIP...');

      // Запускаем проверку сразу при старте сервера
      checkVipExpiry()
        .then(count => {
          console.log(`Проверка срока действия VIP завершена. Обновлено ${count} пользователей.`);
        })
        .catch(error => {
          console.error('Ошибка при проверке срока действия VIP:', error);
        });

      // Запускаем проверку каждый час
      setInterval(() => {
        console.log('Запуск плановой проверки срока действия VIP...');
        checkVipExpiry()
          .then(count => {
            console.log(`Плановая проверка срока действия VIP завершена. Обновлено ${count} пользователей.`);
          })
          .catch(error => {
            console.error('Ошибка при плановой проверке срока действия VIP:', error);
          });
      }, 60 * 60 * 1000); // 1 час
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    // Не завершаем процесс, чтобы сервер мог работать даже без БД
    console.log('Server will continue to run without database connection');

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT} (without DB connection)`);
    });
  }
};

// Обработка необработанных исключений
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Не завершаем процесс в режиме разработки
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Запускаем сервер
startServer();
