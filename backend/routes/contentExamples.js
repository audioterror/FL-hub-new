const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Content = require('../models/Content');
const ContentExample = require('../models/ContentExample');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { uploadFile, deleteFile, getFileUrl } = require('../services/storageService');

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/examples');

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
    cb(null, 'example-' + uniqueSuffix + ext);
  }
});

// Фильтр для проверки типа файла
const fileFilter = (req, file, cb) => {
  // Принимаем только изображения и видео
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Неподдерживаемый тип файла. Разрешены только изображения (JPEG, PNG, GIF) и видео (MP4, WEBM).'), false);
  }
};

// Инициализация multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter
  // Ограничение по размеру файла удалено
});

// Получить все примеры для контента
router.get('/:contentId', authenticateToken, async (req, res) => {
  try {
    const { contentId } = req.params;

    // Проверяем, существует ли контент
    const content = await Content.getById(contentId);
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Получаем примеры
    const examples = await content.getExamples();

    res.json(examples);
  } catch (error) {
    console.error(`Error getting examples for content ID ${req.params.contentId}:`, error);
    res.status(500).json({ error: 'Failed to get examples' });
  }
});

// Добавить новый пример
router.post('/:contentId', authenticateToken, authorizeRoles('ADMIN', 'CEO'), upload.single('file'), async (req, res) => {
  try {
    const { contentId } = req.params;

    // Проверяем, был ли загружен файл
    if (!req.file) {
      return res.status(400).json({ error: 'File is required' });
    }

    // Проверяем, существует ли контент
    const content = await Content.getById(contentId);
    if (!content) {
      // Удаляем файл, если контент не найден
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Content not found' });
    }

    // Определяем тип примера
    const fileType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';

    // Загружаем файл в Yandex Object Storage
    const result = await uploadFile(req.file, 'examples');

    // Создаем новый пример
    const newExample = await ContentExample.create({
      content_id: contentId,
      file_path: result.location,
      type: fileType,
      title: req.body.title || null,
      size: req.file.size
    });

    res.status(201).json(newExample);
  } catch (error) {
    console.error('Error creating content example:', error);

    // Удаляем файл в случае ошибки
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }

    res.status(500).json({ error: 'Failed to create example' });
  }
});

// Удалить пример
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN', 'CEO'), async (req, res) => {
  try {
    const { id } = req.params;

    // Получаем пример перед удалением
    const example = await ContentExample.getById(id);
    if (!example) {
      return res.status(404).json({ error: 'Example not found' });
    }

    // Удаляем файл из Yandex Object Storage, если путь содержит storage.yandexcloud.net
    if (example.file_path && example.file_path.includes('storage.yandexcloud.net')) {
      try {
        await deleteFile(example.file_path);
      } catch (error) {
        console.error(`Error deleting file from storage: ${example.file_path}`, error);
      }
    } else if (example.file_path) {
      // Для обратной совместимости: удаляем файл с диска, если он хранится локально
      try {
        const localFilePath = path.join(__dirname, '..', example.file_path);
        if (fs.existsSync(localFilePath)) {
          fs.unlinkSync(localFilePath);
        }
      } catch (unlinkError) {
        console.error(`Error deleting local file ${example.file_path}:`, unlinkError);
      }
    }

    // Удаляем пример из базы данных
    const deletedExample = await ContentExample.delete(id);

    res.json({
      message: 'Example deleted successfully',
      deleted_example: deletedExample
    });
  } catch (error) {
    console.error(`Error deleting example with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete example' });
  }
});

// Обновить информацию о примере
router.patch('/:id', authenticateToken, authorizeRoles('ADMIN', 'CEO'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    // Проверяем, существует ли пример
    const example = await ContentExample.getById(id);
    if (!example) {
      return res.status(404).json({ error: 'Example not found' });
    }

    // Обновляем информацию о примере
    const updatedExample = await ContentExample.update(id, { title });

    res.json(updatedExample);
  } catch (error) {
    console.error(`Error updating example with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update example' });
  }
});

module.exports = router;
