-- Создание таблицы пользователей
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  is_vip BOOLEAN DEFAULT FALSE,
  vip_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы категорий ресурсов
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы ресурсов
CREATE TABLE IF NOT EXISTS resources (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  category_id INTEGER REFERENCES categories(id),
  file_path VARCHAR(255),
  thumbnail_path VARCHAR(255),
  is_premium BOOLEAN DEFAULT FALSE,
  download_count INTEGER DEFAULT 0,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы тегов
CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание связующей таблицы между ресурсами и тегами
CREATE TABLE IF NOT EXISTS resource_tags (
  resource_id INTEGER REFERENCES resources(id) ON DELETE CASCADE,
  tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (resource_id, tag_id)
);

-- Создание таблицы комментариев
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  resource_id INTEGER REFERENCES resources(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы для хранения информации о подписках VIP
CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  plan_type VARCHAR(20) NOT NULL, -- 'monthly', 'quarterly', 'yearly', etc.
  start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_date TIMESTAMP NOT NULL,
  payment_id VARCHAR(100),
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'expired', 'cancelled'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы для хранения информации о скачиваниях
CREATE TABLE IF NOT EXISTS downloads (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  resource_id INTEGER REFERENCES resources(id),
  downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45)
);

-- Вставка начальных категорий
INSERT INTO categories (name, slug, description, icon) VALUES
('Пресеты', 'presets', 'Пресеты для FL Studio', 'layer-group'),
('Плагины', 'plugins', 'Плагины для FL Studio', 'bolt'),
('Шрифты', 'fonts', 'Шрифты для проектов', 'font'),
('Звуки', 'sounds', 'Звуковые эффекты и музыка', 'music'),
('Футажи', 'footage', 'Видео футажи', 'film'),
('Скрипты', 'scripts', 'Скрипты для автоматизации', 'code'),
('Графика', 'graphics', 'Графические элементы', 'pen-nib'),
('Паки', 'packs', 'Наборы ресурсов', 'box');

-- Создание администратора (пароль нужно будет захешировать в реальном приложении)
INSERT INTO users (username, email, password_hash, is_admin) VALUES
('admin', 'admin@flhub.com', 'temporary_password_hash', TRUE);
