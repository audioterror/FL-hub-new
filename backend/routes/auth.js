const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const passport = require('../config/passport');
const User = require('../models/User');
const emailService = require('../services/emailService');
const { pool } = require('../config/db');
require('dotenv').config();

// Секретный ключ для JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware для инициализации Passport
router.use(passport.initialize());

// Создать JWT токен для пользователя
function createJWTToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user._role ? user._role.name : 'BASIC'
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// Регистрация через email
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Валидация данных
    if (!email || !password || !firstName) {
      return res.status(400).json({
        error: 'Email, пароль и имя обязательны для заполнения'
      });
    }

    // Проверяем формат email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Некорректный формат email'
      });
    }

    // Проверяем минимальную длину пароля
    if (password.length < 6) {
      return res.status(400).json({
        error: 'Пароль должен содержать минимум 6 символов'
      });
    }

    // Проверяем, не существует ли уже пользователь с таким email
    const existingUser = await User.getByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        error: 'Пользователь с таким email уже существует'
      });
    }

    // Создаем токен для верификации email
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Создаем нового пользователя
    const user = await User.create({
      email: email.toLowerCase(),
      password: password,
      first_name: firstName,
      last_name: lastName || '',
      is_email_verified: false,
      email_verification_token: verificationToken
    });

    // Отправляем письмо для верификации
    await emailService.sendVerificationEmail(email, verificationToken);

    res.json({
      message: 'Регистрация успешна. Проверьте ваш email для подтверждения аккаунта.',
      userId: user.id
    });

  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({
      error: 'Ошибка при регистрации. Попробуйте еще раз.'
    });
  }
});

// Верификация email
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Ищем пользователя с таким токеном верификации
    const result = await pool.query(
      'SELECT * FROM tg_users WHERE email_verification_token = $1',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        error: 'Неверный или истекший токен верификации'
      });
    }

    const user = new User(result.rows[0]);

    // Обновляем статус верификации
    await pool.query(
      'UPDATE tg_users SET is_email_verified = TRUE, email_verification_token = NULL WHERE id = $1',
      [user.id]
    );

    res.json({
      message: 'Email успешно подтвержден. Теперь вы можете войти в систему.'
    });

  } catch (error) {
    console.error('Error during email verification:', error);
    res.status(500).json({
      error: 'Ошибка при подтверждении email'
    });
  }
});

// Авторизация через email/password
router.post('/login', (req, res, next) => {
  passport.authenticate('local', async (err, user, info) => {
    try {
      if (err) {
        console.error('Authentication error:', err);
        return res.status(500).json({ error: 'Ошибка авторизации' });
      }

      if (!user) {
        return res.status(401).json({ 
          error: info ? info.message : 'Неверный email или пароль' 
        });
      }

      // Получаем роль пользователя
      const role = await user.getRole();
      user._role = role;

      // Создаем JWT токен
      const token = createJWTToken(user);

      // Возвращаем данные пользователя
      res.json({
        message: 'Авторизация успешна',
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          photo_url: user.photo_url,
          role: role ? role.name : 'BASIC',
          token: token
        }
      });

    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ error: 'Ошибка при входе в систему' });
    }
  })(req, res, next);
});

// Google OAuth маршруты
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  async (req, res) => {
    try {
      // Получаем роль пользователя
      const role = await req.user.getRole();
      req.user._role = role;

      // Создаем JWT токен
      const token = createJWTToken(req.user);

      // Перенаправляем на фронтенд с токеном
      res.redirect(`${process.env.FRONTEND_URL}/auth/google/success?token=${token}`);
    } catch (error) {
      console.error('Error during Google OAuth callback:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }
  }
);

// Запрос сброса пароля
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email обязателен для заполнения'
      });
    }

    // Ищем пользователя
    const user = await User.getByEmail(email);
    if (!user) {
      // Не сообщаем, что пользователь не найден (из соображений безопасности)
      return res.json({
        message: 'Если пользователь с таким email существует, инструкции по сбросу пароля будут отправлены на него.'
      });
    }

    // Создаем токен сброса пароля
    const resetToken = await user.createPasswordResetToken();

    // Отправляем письмо
    await emailService.sendPasswordResetEmail(email, resetToken);

    res.json({
      message: 'Если пользователь с таким email существует, инструкции по сбросу пароля будут отправлены на него.'
    });

  } catch (error) {
    console.error('Error during password reset request:', error);
    res.status(500).json({
      error: 'Ошибка при запросе сброса пароля'
    });
  }
});

// Сброс пароля
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        error: 'Токен и новый пароль обязательны'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'Пароль должен содержать минимум 6 символов'
      });
    }

    // Проверяем токен сброса пароля
    const user = await User.verifyPasswordResetToken(token);
    if (!user) {
      return res.status(400).json({
        error: 'Неверный или истекший токен сброса пароля'
      });
    }

    // Сбрасываем пароль
    await user.resetPassword(newPassword);

    res.json({
      message: 'Пароль успешно изменен. Теперь вы можете войти с новым паролем.'
    });

  } catch (error) {
    console.error('Error during password reset:', error);
    res.status(500).json({
      error: 'Ошибка при сбросе пароля'
    });
  }
});

// Проверка JWT токена
router.get('/verify-token', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Токен не предоставлен' });
    }

    // Проверяем JWT токен
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Получаем пользователя из базы данных
    const user = await User.getById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'Пользователь не найден' });
    }

    // Получаем роль пользователя
    const role = await user.getRole();

    res.json({
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        photo_url: user.photo_url,
        role: role ? role.name : 'BASIC'
      }
    });

  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).json({ error: 'Неверный токен' });
  }
});

// Выход из системы
router.post('/logout', (req, res) => {
  res.json({ message: 'Вы успешно вышли из системы' });
});

module.exports = router;
