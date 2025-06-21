import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSpinner, FaImage, FaVideo, FaCheck, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { API_URL } from '../api/config';
import ReactDOM from 'react-dom';
import './NewsManager.css';

const NewsManager = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('create'); // 'create' или 'edit'
  const [currentNews, setCurrentNews] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    content: ''
  });
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Загрузка новостей
  useEffect(() => {
    // Создаем переменную для отслеживания, смонтирован ли компонент
    let isMounted = true;

    const loadNews = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/news?page=${page}&limit=5`, {
          headers: getAuthHeaders()
        });

        // Проверяем, что компонент все еще смонтирован
        if (!isMounted) return;

        // Проверяем, что ответ содержит ожидаемые данные
        if (response.data && Array.isArray(response.data.news)) {
          setNews(response.data.news);
          setTotalPages(response.data.pagination?.pages || 1);
        } else {
          // Если структура ответа не соответствует ожидаемой, считаем что новостей нет
          console.log('Unexpected response format:', response.data);
          setNews([]);
          setTotalPages(1);
        }

        setLoading(false);
      } catch (error) {
        // Проверяем, что компонент все еще смонтирован
        if (!isMounted) return;

        console.error('Error fetching news:', error);
        setNews([]);
        setError(null); // Сбрасываем ошибку, чтобы показать "Новостей пока нет"
        setLoading(false);
      }
    };

    loadNews();

    // Устанавливаем таймаут для предотвращения бесконечной загрузки
    const timeoutId = setTimeout(() => {
      if (isMounted && loading) {
        setLoading(false);
      }
    }, 5000);

    // Очищаем таймаут и устанавливаем isMounted = false при размонтировании компонента
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [page]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/news?page=${page}&limit=5`, {
        headers: getAuthHeaders()
      });

      // Проверяем, что ответ содержит ожидаемые данные
      if (response.data && Array.isArray(response.data.news)) {
        setNews(response.data.news);
        setTotalPages(response.data.pagination?.pages || 1);
      } else {
        // Если структура ответа не соответствует ожидаемой, считаем что новостей нет
        console.log('Unexpected response format:', response.data);
        setNews([]);
        setTotalPages(1);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching news:', error);
      setNews([]);
      setError(null); // Сбрасываем ошибку, чтобы показать "Новостей пока нет"
      setLoading(false);
    }
  };

  // Получение заголовков авторизации
  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return {
      Authorization: `Bearer ${token}`
    };
  };

  // Обработка изменения полей формы
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Обработка изменения файла медиа
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setMediaFile(file);

    // Создаем превью файла
    const fileReader = new FileReader();
    fileReader.onload = () => {
      setMediaPreview(fileReader.result);
    };
    fileReader.readAsDataURL(file);

    // Определяем тип файла
    if (file.type.startsWith('image/')) {
      setMediaType('image');
    } else if (file.type.startsWith('video/')) {
      setMediaType('video');
    } else {
      setMediaType(null);
    }
  };

  // Открытие формы создания новости
  const handleCreateNews = () => {
    setFormData({
      title: '',
      subtitle: '',
      content: ''
    });
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    setFormMode('create');
    setShowForm(true);
  };

  // Открытие формы редактирования новости
  const handleEditNews = async (newsId) => {
    try {
      const response = await axios.get(`${API_URL}/news/${newsId}`, {
        headers: getAuthHeaders()
      });

      const newsItem = response.data;
      setCurrentNews(newsItem);
      setFormData({
        title: newsItem.title || '',
        subtitle: newsItem.subtitle || '',
        content: newsItem.content || ''
      });

      // Устанавливаем превью медиа, если есть
      if (newsItem.image_url) {
        setMediaPreview(newsItem.image_url);
        setMediaType('image');
      } else if (newsItem.video_url) {
        setMediaPreview(newsItem.video_url);
        setMediaType('video');
      } else {
        setMediaPreview(null);
        setMediaType(null);
      }

      setMediaFile(null);
      setFormMode('edit');
      setShowForm(true);
    } catch (error) {
      console.error('Error fetching news for edit:', error);
      setError('Ошибка при загрузке новости для редактирования.');
    }
  };

  // Отправка формы
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setUploading(true);

      // Проверяем обязательные поля
      if (!formData.title) {
        setError('Заголовок обязателен');
        setUploading(false);
        return;
      }

      let newsId;

      // Создаем или обновляем новость
      if (formMode === 'create') {
        // Создаем новость
        const response = await axios.post(
          `${API_URL}/news`,
          formData,
          { headers: getAuthHeaders() }
        );

        newsId = response.data.id;
      } else {
        // Обновляем новость
        const response = await axios.put(
          `${API_URL}/news/${currentNews.id}`,
          formData,
          { headers: getAuthHeaders() }
        );

        newsId = currentNews.id;
      }

      // Если есть новый файл медиа, загружаем его
      if (mediaFile) {
        const formDataMedia = new FormData();
        formDataMedia.append('media', mediaFile);

        await axios.post(
          `${API_URL}/news/${newsId}/media`,
          formDataMedia,
          {
            headers: {
              ...getAuthHeaders(),
              'Content-Type': 'multipart/form-data'
            }
          }
        );
      }

      // Обновляем список новостей
      await fetchNews();

      // Закрываем форму
      setShowForm(false);
      setUploading(false);
      setError(null);
    } catch (error) {
      console.error('Error saving news:', error);
      setError('Ошибка при сохранении новости. Пожалуйста, попробуйте позже.');
      setUploading(false);
    }
  };

  // Удаление новости
  const handleDeleteNews = async (newsId) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту новость?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/news/${newsId}`, {
        headers: getAuthHeaders()
      });

      // Обновляем список новостей
      await fetchNews();
    } catch (error) {
      console.error('Error deleting news:', error);
      setError('Ошибка при удалении новости. Пожалуйста, попробуйте позже.');
    }
  };

  // Форматирование даты
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="news-manager">
      <div className="news-manager-header">
        <h2>Управление новостями</h2>
        <button className="create-button" onClick={handleCreateNews}>
          <FaPlus /> Создать новость
        </button>
      </div>

      {error && (
        <div className="news-manager-error">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Закрыть</button>
        </div>
      )}

      {loading ? (
        <div className="news-manager-loading">
          <FaSpinner className="spinner" />
          <span>Загрузка новостей...</span>
        </div>
      ) : (
        <div className="news-manager-list">
          {news.length === 0 ? (
            <div className="no-news">
              <p>Новостей пока нет</p>
            </div>
          ) : (
            news.map((item) => (
              <div key={item.id} className="news-manager-item">
                <div className="news-manager-item-content">
                  <h3>{item.title}</h3>
                  <p>{item.subtitle}</p>
                  <div className="news-manager-item-meta">
                    <span>Дата: {formatDate(item.created_at)}</span>
                    {item.image_url && <span className="media-badge image"><FaImage /> Изображение</span>}
                    {item.video_url && <span className="media-badge video"><FaVideo /> Видео</span>}
                  </div>
                </div>
                <div className="news-manager-item-actions">
                  <button className="edit-button" onClick={() => handleEditNews(item.id)}>
                    <FaEdit />
                  </button>
                  <button className="delete-button" onClick={() => handleDeleteNews(item.id)}>
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))
          )}

          {totalPages > 1 && (
            <div className="news-manager-pagination">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Предыдущая
              </button>
              <span>Страница {page} из {totalPages}</span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                Следующая
              </button>
            </div>
          )}
        </div>
      )}

      {/* Модальное окно создания/редактирования новости через портал */}
      {showForm && ReactDOM.createPortal(
        <div className="news-form-overlay" onClick={(e) => {
          // Закрываем форму при клике на оверлей (но не на саму форму)
          if (e.target.className === 'news-form-overlay') {
            setShowForm(false);
          }
        }}>
          <div className="news-form">
            <div className="news-form-header">
              <h3>{formMode === 'create' ? 'Создание новости' : 'Редактирование новости'}</h3>
              <button className="close-form-button" onClick={() => setShowForm(false)}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
              <div className="form-group">
                <label htmlFor="title">Заголовок *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="subtitle">Подзаголовок</label>
                <input
                  type="text"
                  id="subtitle"
                  name="subtitle"
                  value={formData.subtitle}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="content">Содержание</label>
                <textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  rows="6"
                  style={{ resize: 'vertical', minHeight: '100px' }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="media">Медиа (изображение или видео)</label>
                <input
                  type="file"
                  id="media"
                  name="media"
                  onChange={handleFileChange}
                  accept="image/*,video/*"
                />

                {mediaPreview && (
                  <div className="media-preview">
                    {mediaType === 'image' ? (
                      <img src={mediaPreview} alt="Preview" />
                    ) : mediaType === 'video' ? (
                      <video src={mediaPreview} controls />
                    ) : null}
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-button" onClick={() => setShowForm(false)}>
                  Отмена
                </button>
                <button type="submit" className="save-button" disabled={uploading}>
                  {uploading ? <FaSpinner className="spinner" /> : <FaCheck />}
                  {formMode === 'create' ? 'Создать' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body // Рендерим модальное окно прямо в body, вне основного DOM-дерева
      )}
    </div>
  );
};

export default NewsManager;
