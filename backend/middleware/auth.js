const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

// Секретный ключ для JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware для проверки JWT токена
const authenticateToken = async (req, res, next) => {
  try {
    // Получаем заголовок авторизации
    const authHeader = req.headers['authorization'];
    console.log('Auth header:', authHeader ? `${authHeader.substring(0, 15)}...` : 'No auth header');

    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      console.log('No token provided in request');
      return res.status(401).json({ error: 'Authentication token is required' });
    }

    console.log('Token received:', token.substring(0, 10) + '...');
    console.log('JWT_SECRET:', JWT_SECRET ? 'Secret exists' : 'No secret');

    // Проверяем токен
    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
      if (err) {
        console.error('JWT verification error:', err.message);
        return res.status(403).json({ error: 'Invalid or expired token' });
      }

      console.log('JWT decoded successfully:', decoded);

      // Получаем пользователя из базы данных
      const user = await User.getById(decoded.userId);
      if (!user) {
        console.error('User not found for ID:', decoded.userId);
        return res.status(404).json({ error: 'User not found' });
      }

      console.log('User found:', user.id, 'Role:', decoded.role);

      // Добавляем пользователя и информацию из токена в объект запроса
      req.user = user;
      req.userRole = decoded.role;
      req.userId = decoded.userId;
      req.telegramId = decoded.telegramId;
      next();
    });
  } catch (error) {
    console.error('Error in authenticateToken middleware:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Middleware для проверки ролей пользователя
const authorizeRoles = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Получаем роль пользователя
      const role = await req.user.getRole();
      const roleName = role ? role.name : null;

      if (!roleName || !allowedRoles.includes(roleName)) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You do not have permission to access this resource',
          required_roles: allowedRoles,
          your_role: roleName
        });
      }

      next();
    } catch (error) {
      console.error('Error in authorizeRoles middleware:', error);
      res.status(500).json({ error: 'Authorization failed' });
    }
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles
};
