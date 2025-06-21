const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Role = require('../models/Role');
const UserService = require('../services/userService');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { uploadFile, deleteFile, getFileUrl } = require('../services/storageService');

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');

    // Создаем директорию, если она не существует
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Генерируем уникальное имя файла
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'avatar-' + uniqueSuffix + ext);
  }
});

// Фильтр для проверки типа файла
const fileFilter = (req, file, cb) => {
  // Принимаем только изображения
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Только изображения могут быть загружены!'), false);
  }
};

// Инициализация multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter
  // Ограничение по размеру файла удалено
});

// Получить всех пользователей (только для CEO)
router.get('/', authenticateToken, authorizeRoles('CEO'), async (req, res) => {
  try {
    const users = await UserService.getAllUsersWithRoles();
    res.json(users);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Получить все роли (только для CEO)
router.get('/roles/all', authenticateToken, authorizeRoles('CEO'), async (req, res) => {
  try {
    const roles = await Role.getAll();
    res.json(roles);
  } catch (error) {
    console.error('Error getting roles:', error);
    res.status(500).json({ error: 'Failed to get roles' });
  }
});

// Получить пользователя по ID (только для CEO)
router.get('/:id', authenticateToken, authorizeRoles('CEO'), async (req, res) => {
  try {
    const user = await User.getById(parseInt(req.params.id));
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const role = await user.getRole();
    res.json({
      ...user,
      role_name: role ? role.name : null
    });
  } catch (error) {
    console.error(`Error getting user with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Создать пользователя (только для CEO, для тестирования)
router.post('/', authenticateToken, authorizeRoles('CEO'), async (req, res) => {
  try {
    const { telegram_id, telegram_username, first_name, last_name, role_name } = req.body;

    if (!telegram_id || !first_name) {
      return res.status(400).json({ error: 'telegram_id and first_name are required' });
    }

    // Проверяем, существует ли пользователь с таким Telegram ID
    const existingUser = await User.getByTelegramId(telegram_id);
    if (existingUser) {
      return res.status(409).json({ error: 'User with this Telegram ID already exists' });
    }

    // Если указана роль, получаем ее ID
    let role_id;
    if (role_name) {
      const role = await Role.getByName(role_name);
      if (!role) {
        return res.status(400).json({ error: `Role '${role_name}' not found` });
      }
      role_id = role.id;
    } else {
      // Используем BASIC роль по умолчанию
      role_id = await Role.getBasicRoleId();
    }

    // Создаем пользователя
    const user = await User.create({
      telegram_id,
      telegram_username,
      first_name,
      last_name,
      role_id
    });

    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Обновить роль пользователя (только для CEO)
router.patch('/:id/role', authenticateToken, authorizeRoles('CEO'), async (req, res) => {
  try {
    const { role_name, send_notification, duration_months } = req.body;

    if (!role_name) {
      return res.status(400).json({ error: 'role_name is required' });
    }

    // По умолчанию отправляем уведомление, если не указано иное
    const sendNotification = send_notification !== false;

    // Получаем пользователя
    const userId = parseInt(req.params.id);
    const user = await User.getById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Получаем текущую роль пользователя
    const currentRole = await user.getRole();
    const currentRoleName = currentRole ? currentRole.name : null;

    // Если роль не изменилась, просто возвращаем пользователя
    if (currentRoleName === role_name && !duration_months) {
      console.log(`User ${userId} already has role ${role_name}`);
      const role = await user.getRole();
      return res.json({
        ...user,
        role_name: role ? role.name : null,
        notification_sent: false
      });
    }

    // Запрещаем изменение роли CEO
    if (currentRoleName === 'CEO') {
      console.log(`Cannot change role for user ${userId} because they have CEO role`);
      return res.status(403).json({ error: 'Cannot change role for users with CEO role' });
    }

    // Запрещаем назначение роли CEO другим пользователям
    if (role_name === 'CEO') {
      console.log(`Cannot assign CEO role to user ${userId}`);
      return res.status(403).json({ error: 'Cannot assign CEO role to other users. This role is reserved for the project owner.' });
    }

    // Получаем роль по имени
    const role = await Role.getByName(role_name);
    if (!role) {
      return res.status(400).json({ error: `Role with name ${role_name} not found` });
    }

    // Обновляем данные пользователя
    const updateData = { role_id: role.id };

    // Если роль VIP и указан срок действия, устанавливаем его
    if (role_name === 'VIP' && duration_months) {
      console.log(`Setting VIP expiry for user ${userId} to ${duration_months} months`);

      // Вычисляем дату истечения срока действия
      const now = new Date();
      const expiryDate = new Date(now);
      expiryDate.setMonth(now.getMonth() + parseInt(duration_months));

      updateData.vip_expires_at = expiryDate;
    } else if (role_name === 'ADMIN' && duration_months) {
      // Для ADMIN устанавливаем срок действия на 100 лет (фактически бессрочно)
      console.log(`Setting ADMIN role for user ${userId} (permanent)`);

      const now = new Date();
      const expiryDate = new Date(now);
      expiryDate.setFullYear(now.getFullYear() + 100);

      updateData.vip_expires_at = null; // Для админа не устанавливаем срок
    } else if (role_name === 'BASIC') {
      // Для BASIC сбрасываем срок действия VIP
      updateData.vip_expires_at = null;
    }

    // Обновляем пользователя
    await user.update(updateData);

    console.log(`Changed role for user ${userId} from ${currentRoleName} to ${role_name}`);

    // Отправляем уведомление пользователю, если нужно
    if (sendNotification && user.telegram_id) {
      try {
        const { sendRoleChangeNotification } = require('../services/messageService');
        const notificationSent = await sendRoleChangeNotification(user.telegram_id, role_name, duration_months);
        console.log(`Role change notification ${notificationSent ? 'sent' : 'failed'} for user ${userId}`);
      } catch (notificationError) {
        console.error(`Error sending role change notification to user ${userId}:`, notificationError);
        // Не прерываем выполнение функции из-за ошибки отправки уведомления
      }
    }

    // Получаем обновленную роль пользователя
    const updatedRole = await user.getRole();

    res.json({
      ...user,
      role_name: updatedRole ? updatedRole.name : null,
      notification_sent: sendNotification
    });
  } catch (error) {
    console.error(`Error updating role for user with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Обновить фото пользователя (профиль)
router.post('/profile/photo', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    // Проверяем, был ли загружен файл
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user.id;
    const user = await User.getById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Если у пользователя уже есть фото, удаляем старый файл из хранилища
    if (user.photo_url && user.photo_url.includes('storage.yandexcloud.net')) {
      try {
        await deleteFile(user.photo_url);
      } catch (error) {
        console.error('Error deleting old photo:', error);
        // Продолжаем выполнение, даже если не удалось удалить старую фотографию
      }
    }

    // Загружаем файл в Yandex Object Storage
    const result = await uploadFile(req.file, 'avatars');

    // Обновляем URL фото пользователя в базе данных
    const updatedUser = await User.update(userId, {
      photo_url: result.location
    });

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      ...updatedUser,
      photo_url: result.location
    });
  } catch (error) {
    console.error('Error updating user photo:', error);

    // Удаляем загруженный файл в случае ошибки
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }

    res.status(500).json({ error: 'Failed to update user photo' });
  }
});

// Удалить пользователя (только для CEO)
router.delete('/:id', authenticateToken, authorizeRoles('CEO'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Получаем пользователя
    const user = await User.getById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Получаем роль пользователя
    const role = await user.getRole();

    // Запрещаем удаление пользователя с ролью CEO
    if (role && role.name === 'CEO') {
      return res.status(403).json({ error: 'Cannot delete user with CEO role' });
    }

    // Удаляем пользователя
    await user.delete();

    res.json({
      message: 'User deleted successfully',
      deleted_user_id: userId
    });
  } catch (error) {
    console.error(`Error deleting user with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;
