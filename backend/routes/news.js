const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const News = require('../models/News');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { uploadFile, deleteFile, getFileUrl } = require('../services/storageService');

// Настройка хранилища для загрузки файлов
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/news');

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
    cb(null, 'news-' + uniqueSuffix + ext);
  }
});

// Фильтр для проверки типа файла
const fileFilter = (req, file, cb) => {
  // Принимаем только изображения и видео
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Только изображения и видео могут быть загружены!'), false);
  }
};

// Инициализация multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter
  // Ограничение по размеру файла удалено
});

// Получить все новости с пагинацией
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Получаем общее количество новостей
    const total = await News.getCount();

    // Если новостей нет, возвращаем пустой массив
    if (total === 0) {
      return res.json({
        news: [],
        pagination: {
          total: 0,
          page: 1,
          limit,
          pages: 0
        }
      });
    }

    // Получаем новости для текущей страницы
    const news = await News.getAll(page, limit);

    // Если новости не найдены (например, запрошена страница, которой нет),
    // возвращаем пустой массив и правильную пагинацию
    if (news.length === 0 && page > 1) {
      return res.json({
        news: [],
        pagination: {
          total,
          page: 1, // Возвращаем на первую страницу
          limit,
          pages: Math.ceil(total / limit)
        }
      });
    }

    // Получаем информацию об авторах
    const newsWithAuthors = await Promise.all(
      news.map(async (item) => {
        const author = await item.getAuthor();
        return {
          ...item,
          author: author ? {
            id: author.id,
            telegram_username: author.telegram_username,
            first_name: author.first_name,
            last_name: author.last_name,
            photo_url: author.photo_url
          } : null
        };
      })
    );

    res.json({
      news: newsWithAuthors,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting news:', error);

    // Возвращаем пустой массив вместо ошибки, чтобы клиент мог корректно отобразить "нет новостей"
    res.json({
      news: [],
      pagination: {
        total: 0,
        page: 1,
        limit: parseInt(req.query.limit) || 10,
        pages: 0
      }
    });
  }
});

// Получить новость по ID
router.get('/:id', async (req, res) => {
  try {
    const newsItem = await News.getById(parseInt(req.params.id));

    if (!newsItem) {
      return res.status(404).json({ error: 'News not found' });
    }

    // Получаем информацию об авторе
    const author = await newsItem.getAuthor();

    res.json({
      ...newsItem,
      author: author ? {
        id: author.id,
        telegram_username: author.telegram_username,
        first_name: author.first_name,
        last_name: author.last_name,
        photo_url: author.photo_url
      } : null
    });
  } catch (error) {
    console.error(`Error getting news with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to get news' });
  }
});

// Создать новость (только для CEO)
router.post('/', authenticateToken, authorizeRoles('CEO'), async (req, res) => {
  try {
    const { title, subtitle, content } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'title is required' });
    }

    // Создаем новость
    const newsItem = await News.create({
      title,
      subtitle,
      content,
      author_id: req.userId
    });

    res.status(201).json(newsItem);
  } catch (error) {
    console.error('Error creating news:', error);
    res.status(500).json({ error: 'Failed to create news' });
  }
});

// Загрузить медиа для новости (только для CEO)
router.post('/:id/media', authenticateToken, authorizeRoles('CEO'), upload.single('media'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const newsId = parseInt(req.params.id);
    const newsItem = await News.getById(newsId);

    if (!newsItem) {
      // Удаляем загруженный файл, если новость не найдена
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'News not found' });
    }

    // Определяем тип файла (изображение или видео)
    const isVideo = req.file.mimetype.startsWith('video/');
    const isImage = req.file.mimetype.startsWith('image/');

    // Если у новости уже есть медиа, удаляем старый файл из хранилища
    if (isVideo && newsItem.video_url && newsItem.video_url.includes('storage.yandexcloud.net')) {
      try {
        await deleteFile(newsItem.video_url);
      } catch (error) {
        console.error('Error deleting old video:', error);
      }
    } else if (isImage && newsItem.image_url && newsItem.image_url.includes('storage.yandexcloud.net')) {
      try {
        await deleteFile(newsItem.image_url);
      } catch (error) {
        console.error('Error deleting old image:', error);
      }
    }

    // Загружаем файл в Yandex Object Storage
    const result = await uploadFile(req.file, 'news');

    // Обновляем URL медиа новости в базе данных в зависимости от типа файла
    const updateData = isVideo
      ? { video_url: result.location }
      : { image_url: result.location };

    // Обновляем новость
    const updatedNews = await News.update(newsId, updateData);

    if (!updatedNews) {
      return res.status(404).json({ error: 'News not found' });
    }

    // Получаем информацию об авторе
    const author = await updatedNews.getAuthor();

    res.json({
      ...updatedNews,
      author: author ? {
        id: author.id,
        telegram_username: author.telegram_username,
        first_name: author.first_name,
        last_name: author.last_name,
        photo_url: author.photo_url
      } : null
    });
  } catch (error) {
    console.error('Error uploading news media:', error);

    // Удаляем загруженный файл в случае ошибки
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }

    res.status(500).json({ error: 'Failed to upload news media' });
  }
});

// Обновить новость (только для CEO)
router.put('/:id', authenticateToken, authorizeRoles('CEO'), async (req, res) => {
  try {
    const newsId = parseInt(req.params.id);
    const newsItem = await News.getById(newsId);

    if (!newsItem) {
      return res.status(404).json({ error: 'News not found' });
    }

    const { title, subtitle, content, image_url, video_url } = req.body;

    // Обновляем новость
    const updatedNews = await newsItem.update({
      title,
      subtitle,
      content,
      image_url,
      video_url
    });

    res.json(updatedNews);
  } catch (error) {
    console.error(`Error updating news with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update news' });
  }
});

// Удалить новость (только для CEO)
router.delete('/:id', authenticateToken, authorizeRoles('CEO'), async (req, res) => {
  try {
    const newsId = parseInt(req.params.id);
    const newsItem = await News.getById(newsId);

    if (!newsItem) {
      return res.status(404).json({ error: 'News not found' });
    }

    // Если у новости есть видео, удаляем файл из хранилища
    if (newsItem.video_url && newsItem.video_url.includes('storage.yandexcloud.net')) {
      try {
        await deleteFile(newsItem.video_url);
      } catch (error) {
        console.error('Error deleting video file:', error);
        // Продолжаем выполнение, даже если не удалось удалить файл
      }
    }

    // Если у новости есть изображение, удаляем файл из хранилища
    if (newsItem.image_url && newsItem.image_url.includes('storage.yandexcloud.net')) {
      try {
        await deleteFile(newsItem.image_url);
      } catch (error) {
        console.error('Error deleting image file:', error);
        // Продолжаем выполнение, даже если не удалось удалить файл
      }
    }

    // Удаляем новость из базы данных
    const deletedNews = await News.delete(newsId);

    if (!deletedNews) {
      return res.status(404).json({ error: 'News not found' });
    }

    res.json({
      message: 'News deleted successfully',
      deleted_news: deletedNews
    });
  } catch (error) {
    console.error(`Error deleting news with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete news' });
  }
});

module.exports = router;
