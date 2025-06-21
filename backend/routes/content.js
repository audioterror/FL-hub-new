const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Throttle } = require('stream-throttle');
const Content = require('../models/Content');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { uploadFile, deleteFile, getFileUrl, getFileStream } = require('../services/storageService');

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
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Фильтр для проверки типа файла
const fileFilter = (req, file, cb) => {
  // Принимаем все типы файлов, но можно добавить ограничения
  cb(null, true);
};

// Инициализация multer для нескольких файлов
const upload = multer({
  storage: storage,
  fileFilter: fileFilter
  // Ограничение по размеру файла удалено
}).fields([
  { name: 'file', maxCount: 1 },
  { name: 'cover_image', maxCount: 1 }
]);

// Получить список всего контента
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { type } = req.query;
    const contentList = await Content.getAll(type);

    // Формируем ответ с дополнительной информацией
    const contentWithDetails = await Promise.all(contentList.map(async (content) => {
      const uploader = await content.getUploader();
      return {
        ...content,
        uploader_name: uploader ? `${uploader.first_name} ${uploader.last_name || ''}`.trim() : 'Unknown',
        uploader_username: uploader ? uploader.telegram_username : null,
        size_mb: content.size ? (content.size / (1024 * 1024)).toFixed(2) : null
      };
    }));

    // Сохраняем количество контента в заголовке ответа
    res.setHeader('X-Total-Content-Count', contentList.length);

    res.json(contentWithDetails);
  } catch (error) {
    console.error('Error getting content list:', error);
    res.status(500).json({ error: 'Failed to get content list' });
  }
});

// Получить количество контента
router.get('/count', authenticateToken, async (req, res) => {
  try {
    const contentList = await Content.getAll();
    res.json({ count: contentList.length });
  } catch (error) {
    console.error('Error getting content count:', error);
    res.status(500).json({ error: 'Failed to get content count' });
  }
});

// Добавить новый контент
router.post('/', authenticateToken, authorizeRoles('ADMIN', 'CEO'), upload, async (req, res) => {
  try {
    // Проверяем, был ли загружен файл
    if (!req.files || !req.files.file || !req.files.file[0]) {
      return res.status(400).json({ error: 'File is required' });
    }

    // Получаем данные из запроса
    const { title, type, description, compatibility } = req.body;
    const mainFile = req.files.file[0];
    const coverImageFile = req.files.cover_image ? req.files.cover_image[0] : null;

    // Проверяем обязательные поля
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    if (!type) {
      return res.status(400).json({ error: 'Type is required' });
    }

    // Проверяем, что тип контента допустимый
    const validTypes = ['Preset', 'Plugin', 'Font', 'Sound', 'Footage', 'Script', 'Graphic', 'Pack'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: 'Invalid content type',
        valid_types: validTypes
      });
    }

    // Загружаем основной файл в Yandex Object Storage
    const fileResult = await uploadFile(mainFile, `content/${type.toLowerCase()}`);
    
    // Загружаем обложку, если она есть
    let coverImageUrl = null;
    if (coverImageFile) {
      const coverResult = await uploadFile(coverImageFile, 'covers');
      coverImageUrl = coverResult.location;
    }

    // Создаем новый элемент контента
    const newContent = await Content.create({
      title,
      type,
      description,
      compatibility,
      file_path: fileResult.location,
      uploaded_by: req.user.id,
      size: mainFile.size,
      cover_image: coverImageUrl
    });

    // Получаем информацию о пользователе, загрузившем контент
    const uploader = await newContent.getUploader();

    // Возвращаем созданный элемент контента
    res.status(201).json({
      ...newContent,
      uploader_name: uploader ? `${uploader.first_name} ${uploader.last_name || ''}`.trim() : 'Unknown',
      uploader_username: uploader ? uploader.telegram_username : null,
      size_mb: newContent.size ? (newContent.size / (1024 * 1024)).toFixed(2) : null
    });
  } catch (error) {
    console.error('Error creating content:', error);
    
    // Удаляем загруженные файлы в случае ошибки
    if (req.files) {
      Object.values(req.files).forEach(fileArray => {
        fileArray.forEach(file => {
          try {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          } catch (unlinkError) {
            console.error('Error deleting file:', unlinkError);
          }
        });
      });
    }
    
    res.status(500).json({ error: 'Failed to create content' });
  }
});

// Удалить контент
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN', 'CEO'), async (req, res) => {
  try {
    const { id } = req.params;

    // Получаем элемент контента перед удалением
    const content = await Content.getById(id);

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Удаляем файл из Yandex Object Storage, если путь содержит storage.yandexcloud.net
    if (content.file_path && content.file_path.includes('storage.yandexcloud.net')) {
      try {
        await deleteFile(content.file_path);
      } catch (error) {
        console.error(`Error deleting file from storage: ${content.file_path}`, error);
      }
    } else if (content.file_path) {
      // Для обратной совместимости: удаляем файл с диска, если он хранится локально
      try {
        const localFilePath = path.join(__dirname, '..', content.file_path);
        if (fs.existsSync(localFilePath)) {
          fs.unlinkSync(localFilePath);
        }
      } catch (unlinkError) {
        console.error(`Error deleting local file ${content.file_path}:`, unlinkError);
      }
    }

    // Удаляем элемент контента из базы данных
    const deletedContent = await Content.delete(id);

    if (!deletedContent) {
      return res.status(404).json({ error: 'Content not found' });
    }

    res.json({
      message: 'Content deleted successfully',
      deleted_content: deletedContent
    });
  } catch (error) {
    console.error(`Error deleting content with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete content' });
  }
});

// Обновить информацию о контенте
router.put('/:id', authenticateToken, authorizeRoles('ADMIN', 'CEO'), upload, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, compatibility } = req.body;
    const coverImageFile = req.files && req.files.cover_image ? req.files.cover_image[0] : null;
    
    // Получаем существующий контент
    const content = await Content.getById(id);
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    // Загружаем новую обложку, если она есть
    let coverImageUrl = content.cover_image;
    if (coverImageFile) {
      // Удаляем старую обложку, если она есть
      if (content.cover_image) {
        await deleteFile(content.cover_image);
      }
      
      // Загружаем новую обложку
      const coverResult = await uploadFile(coverImageFile, 'covers');
      coverImageUrl = coverResult.location;
    }
    
    // Обновляем контент
    const updatedContent = await content.update({
      title,
      description,
      compatibility,
      cover_image: coverImageUrl
    });
    
    // Получаем информацию о пользователе, загрузившем контент
    const uploader = await updatedContent.getUploader();
    
    // Возвращаем обновленный элемент контента
    res.json({
      ...updatedContent,
      uploader_name: uploader ? `${uploader.first_name} ${uploader.last_name || ''}`.trim() : 'Unknown',
      uploader_username: uploader ? uploader.telegram_username : null,
      size_mb: updatedContent.size ? (updatedContent.size / (1024 * 1024)).toFixed(2) : null
    });
  } catch (error) {
    console.error(`Error updating content with ID ${req.params.id}:`, error);
    
    // Удаляем загруженные файлы в случае ошибки
    if (req.files) {
      Object.values(req.files).forEach(fileArray => {
        fileArray.forEach(file => {
          try {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          } catch (unlinkError) {
            console.error('Error deleting file:', unlinkError);
          }
        });
      });
    }
    
    res.status(500).json({ error: 'Failed to update content' });
  }
});

// Скачать файл контента с ограничением скорости в зависимости от роли пользователя
router.get('/:id/download', async (req, res, next) => {
  // Получаем токен из заголовка или из параметра запроса
  const authHeader = req.headers.authorization || req.query.Authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  // Проверяем токен
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    req.userRole = decoded.role;
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
  try {
    const { id } = req.params;

    // Получаем элемент контента
    const content = await Content.getById(id);

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Проверяем, является ли файл URL из Yandex Object Storage
    if (content.file_path && content.file_path.startsWith('http')) {
      // Увеличиваем счетчик скачиваний
      await Content.incrementDownloadsCount(id);

      // Для файлов из Object Storage выполняем редирект на URL
      // Ограничение скорости не может быть применено в этом случае
      return res.redirect(content.file_path);
    }

    // Получаем абсолютный путь к файлу для локальных файлов
    const filePath = content.getAbsoluteFilePath();

    // Проверяем, существует ли файл
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Получаем информацию о файле
    const stat = fs.statSync(filePath);

    // Получаем расширение файла
    const ext = path.extname(filePath);

    // Определяем MIME-тип файла на основе расширения
    let contentType = 'application/octet-stream'; // По умолчанию

    // Простая карта расширений и MIME-типов
    const mimeTypes = {
      '.zip': 'application/zip',
      '.rar': 'application/x-rar-compressed',
      '.7z': 'application/x-7z-compressed',
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.mp4': 'video/mp4',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
      '.txt': 'text/plain',
      '.json': 'application/json',
      '.xml': 'application/xml',
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.ttf': 'font/ttf',
      '.otf': 'font/otf',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2'
    };

    if (ext && mimeTypes[ext.toLowerCase()]) {
      contentType = mimeTypes[ext.toLowerCase()];
    }

    // Получаем оригинальное имя файла из пути
    let originalFileName = '';
    if (filePath) {
      originalFileName = path.basename(filePath);
    }

    // Если не удалось получить оригинальное имя файла, используем заголовок с расширением
    if (!originalFileName || originalFileName === '') {
      originalFileName = (content.title || 'download') + ext;
    }

    // Формируем имя файла для скачивания
    const fileName = encodeURIComponent(originalFileName);

    // Устанавливаем заголовки для скачивания
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', stat.size);

    // Создаем поток чтения файла
    const readStream = fs.createReadStream(filePath);

    // Обработка ошибок чтения файла
    readStream.on('error', (err) => {
      console.error(`Error reading file ${filePath}:`, err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error reading file' });
      }
    });

    // Обработка закрытия соединения
    res.on('close', () => {
      readStream.destroy();
    });

    // Получаем роль пользователя
    const userRole = req.userRole;

    // Ограничиваем скорость скачивания для пользователей с ролью BASIC
    if (userRole === 'BASIC') {
      // Ограничиваем скорость до 200 КБ/с
      const throttle = new Throttle({ rate: 200 * 1024 }); // 200 KB/s

      console.log(`Throttling download for BASIC user (${req.user.telegram_username || req.user.telegram_id}) to 200 KB/s`);

      // Передаем файл через ограничитель скорости
      readStream.pipe(throttle).pipe(res);
    } else {
      // Для остальных ролей (VIP, ADMIN, CEO) скачивание без ограничений
      console.log(`Unrestricted download for ${userRole} user (${req.user.telegram_username || req.user.telegram_id})`);

      // Передаем файл напрямую
      readStream.pipe(res);
    }

    // Увеличиваем счетчик скачиваний после завершения
    res.on('finish', async () => {
      try {
        await Content.incrementDownloadsCount(id);
        console.log(`Download count incremented for content ID ${id}`);
      } catch (error) {
        console.error(`Error incrementing download count for content ID ${id}:`, error);
      }
    });
  } catch (error) {
    console.error(`Error downloading content with ID ${req.params.id}:`, error);
    next(error);
  }
});

// Скачать контент (потоковая передача)
router.get('/:id/stream-download', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const content = await Content.getById(id);

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Увеличиваем счетчик скачиваний
    await Content.incrementDownloadsCount(id);

    // Получаем информацию о пользователе
    const userRole = req.user.role;
    const throttleSpeed = userRole === 'BASIC' ? 200 * 1024 : null; // 200 KB/s для BASIC, без ограничения для других

    // Получаем файл
    let fileStream;
    let contentLength;
    let contentType;

    try {
      // Проверяем, хранится ли файл в Object Storage или локально
      if (content.file_path.startsWith('http')) {
        // Получаем поток из Object Storage
        const fileInfo = await getFileStream(content.file_path);
        fileStream = fileInfo.stream;
        contentLength = fileInfo.contentLength;
        contentType = fileInfo.contentType;
      } else {
        // Получаем файл с локального диска
        const filePath = content.getAbsoluteFilePath();
        if (!filePath || !fs.existsSync(filePath)) {
          return res.status(404).json({ error: 'File not found' });
        }

        const stats = fs.statSync(filePath);
        fileStream = fs.createReadStream(filePath);
        contentLength = stats.size;
        contentType = 'application/octet-stream';
      }

      // Устанавливаем заголовки ответа
      res.setHeader('Content-Length', contentLength);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(content.title)}"`);

      // Если пользователь BASIC, ограничиваем скорость скачивания
      if (throttleSpeed) {
        const throttle = new Throttle({ rate: throttleSpeed });
        fileStream.pipe(throttle).pipe(res);
      } else {
        fileStream.pipe(res);
      }
    } catch (error) {
      console.error(`Error streaming file for content ID ${id}:`, error);
      return res.status(500).json({ error: 'Error streaming file' });
    }
  } catch (error) {
    console.error(`Error downloading content with ID ${req.params.id}:`, error);
    next(error);
  }
});

// Тестовый маршрут для скачивания файла с ограничением скорости (только для разработки)
if (process.env.NODE_ENV === 'development') {
  router.get('/:id/test-download/:role', async (req, res, next) => {
    try {
      const { id, role } = req.params;

      // Проверяем, что роль допустима
      if (!['BASIC', 'VIP', 'ADMIN', 'CEO'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role. Must be one of: BASIC, VIP, ADMIN, CEO' });
      }

      // Получаем элемент контента
      const content = await Content.getById(id);

      if (!content) {
        return res.status(404).json({ error: 'Content not found' });
      }

      // Проверяем, является ли файл URL из Yandex Object Storage
      if (content.file_path && content.file_path.startsWith('http')) {
        // Увеличиваем счетчик скачиваний
        await Content.incrementDownloadsCount(id);

        // Для файлов из Object Storage выполняем редирект на URL
        // Ограничение скорости не может быть применено в этом случае
        return res.redirect(content.file_path);
      }

      // Получаем абсолютный путь к файлу для локальных файлов
      const filePath = content.getAbsoluteFilePath();

      // Проверяем, существует ли файл
      if (!filePath || !fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Получаем информацию о файле
      const stat = fs.statSync(filePath);

      // Получаем расширение файла
      const ext = path.extname(filePath);

      // Определяем MIME-тип файла на основе расширения
      let contentType = 'application/octet-stream'; // По умолчанию

      // Простая карта расширений и MIME-типов
      const mimeTypes = {
        '.zip': 'application/zip',
        '.rar': 'application/x-rar-compressed',
        '.7z': 'application/x-7z-compressed',
        '.pdf': 'application/pdf',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.mp4': 'video/mp4',
        '.avi': 'video/x-msvideo',
        '.mov': 'video/quicktime',
        '.txt': 'text/plain',
        '.json': 'application/json',
        '.xml': 'application/xml',
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.ttf': 'font/ttf',
        '.otf': 'font/otf',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2'
      };

      if (ext && mimeTypes[ext.toLowerCase()]) {
        contentType = mimeTypes[ext.toLowerCase()];
      }

      // Получаем оригинальное имя файла из пути
      let originalFileName = '';
      if (filePath) {
        originalFileName = path.basename(filePath);
      }

      // Если не удалось получить оригинальное имя файла, используем заголовок с расширением
      if (!originalFileName || originalFileName === '') {
        originalFileName = (content.title || 'download') + ext;
      }

      // Формируем имя файла для скачивания
      const fileName = encodeURIComponent(originalFileName);

      // Устанавливаем заголовки для скачивания
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', stat.size);

      // Создаем поток чтения файла
      const readStream = fs.createReadStream(filePath);

      // Обработка ошибок чтения файла
      readStream.on('error', (err) => {
        console.error(`Error reading file ${filePath}:`, err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Error reading file' });
        }
      });

      // Обработка закрытия соединения
      res.on('close', () => {
        readStream.destroy();
      });

      // Ограничиваем скорость скачивания для пользователей с ролью BASIC
      if (role === 'BASIC') {
        // Ограничиваем скорость до 200 КБ/с
        const throttle = new Throttle({ rate: 200 * 1024 }); // 200 KB/s

        console.log(`Throttling download for BASIC user (${req.user.telegram_username || req.user.telegram_id}) to 200 KB/s`);

        // Передаем файл через ограничитель скорости
        readStream.pipe(throttle).pipe(res);
      } else {
        // Для остальных ролей (VIP, ADMIN, CEO) скачивание без ограничений
        console.log(`Unrestricted download for ${role} user (${req.user.telegram_username || req.user.telegram_id})`);

        // Передаем файл напрямую
        readStream.pipe(res);
      }

      // Увеличиваем счетчик скачиваний после завершения
      res.on('finish', async () => {
        try {
          await Content.incrementDownloadsCount(id);
          console.log(`Download count incremented for content ID ${id}`);
        } catch (error) {
          console.error(`Error incrementing download count for content ID ${id}:`, error);
        }
      });
    } catch (error) {
      console.error(`Error downloading content with ID ${req.params.id}:`, error);
      next(error);
    }
  });
}

module.exports = router;