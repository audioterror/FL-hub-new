import React, { useState, useEffect } from 'react';
import { FaTimes, FaSave, FaSpinner, FaUpload, FaTrash, FaImage, FaVideo, FaPlus, FaCheck } from 'react-icons/fa';
import axios from 'axios';
import { API_URL } from '../api/config';
import './EditContentModal.css';
import { resolveFileUrl } from '../utils/urlHelpers';

/**
 * Модальное окно для редактирования информации о контенте
 * @param {Object} props - Свойства компонента
 * @param {Object} props.item - Элемент контента
 * @param {Function} props.onClose - Функция закрытия модального окна
 * @param {Function} props.onUpdate - Функция обновления списка контента
 * @returns {React.ReactNode}
 */
const EditContentModal = ({ item, onClose, onUpdate }) => {
  // Состояние для формы редактирования
  const [title, setTitle] = useState(item.title || '');
  const [description, setDescription] = useState(item.description || '');
  const [compatibility, setCompatibility] = useState(item.compatibility || '');
  const [selectedCoverImage, setSelectedCoverImage] = useState(null);
  const [coverImageName, setCoverImageName] = useState('');
  const [coverImageSize, setCoverImageSize] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState(item.cover_image || null);

  // Состояние для примеров
  const [examples, setExamples] = useState([]);
  const [loadingExamples, setLoadingExamples] = useState(true);
  const [exampleTitle, setExampleTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingExample, setUploadingExample] = useState(false);

  // Состояние для загрузки
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Загрузка примеров при монтировании компонента
  useEffect(() => {
    fetchExamples();
  }, []);

  // Функция для загрузки примеров
  const fetchExamples = async () => {
    try {
      setLoadingExamples(true);

      // Получаем токен из localStorage
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        setLoadingExamples(false);
        return;
      }

      // Выполняем запрос к API
      const response = await axios.get(`${API_URL}/content-examples/${item.id}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      // Обновляем состояние
      setExamples(response.data);
      setLoadingExamples(false);
    } catch (error) {
      console.error('Error fetching examples:', error);
      setLoadingExamples(false);
    }
  };

  // Обработчик изменения обложки
  const handleCoverImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Проверяем, что файл является изображением
      if (!file.type.startsWith('image/')) {
        alert('Пожалуйста, выберите изображение для обложки');
        return;
      }

      setSelectedCoverImage(file);
      setCoverImageName(file.name);
      setCoverImageSize(file.size);

      // Создаем URL для предпросмотра
      const previewUrl = URL.createObjectURL(file);
      setCoverImagePreview(previewUrl);
    }
  };

  // Обработчик изменения файла примера
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Проверяем, что файл является изображением или видео
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) {
        alert('Пожалуйста, выберите изображение или видео');
        return;
      }

      setSelectedFile(file);
    }
  };

  // Форматирование совместимости в виде списка
  const formatCompatibility = (text) => {
    if (!text) return '';
    // Разделяем текст по переносам строки и фильтруем пустые строки
    return text.split('\n').filter(line => line.trim() !== '').join('\n');
  };

  // Обработчик добавления примера
  const handleAddExample = async () => {
    if (!selectedFile) {
      return;
    }

    try {
      setUploadingExample(true);

      // Получаем токен из localStorage
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        setUploadingExample(false);
        return;
      }

      // Создаем объект FormData для отправки файла
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', exampleTitle);

      // Выполняем запрос к API
      const response = await axios.post(`${API_URL}/content-examples/${item.id}`, formData, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      // Добавляем новый пример в список
      setExamples([response.data, ...examples]);

      // Очищаем форму
      setExampleTitle('');
      setSelectedFile(null);

      setUploadingExample(false);
    } catch (error) {
      console.error('Error uploading example:', error);
      setUploadingExample(false);
    }
  };

  // Обработчик удаления примера
  const handleDeleteExample = async (exampleId) => {
    try {
      // Получаем токен из localStorage
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        return;
      }

      // Выполняем запрос к API
      await axios.delete(`${API_URL}/content-examples/${exampleId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      // Удаляем пример из списка
      setExamples(examples.filter(example => example.id !== exampleId));
    } catch (error) {
      console.error('Error deleting example:', error);
    }
  };

  // Обработчик отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      // Получаем токен из localStorage
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        setError('Требуется авторизация');
        setLoading(false);
        return;
      }

      // Создаем объект FormData для отправки данных
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('compatibility', formatCompatibility(compatibility));
      
      // Добавляем обложку, если она выбрана
      if (selectedCoverImage) {
        formData.append('cover_image', selectedCoverImage);
      }

      // Выполняем запрос к API
      const response = await axios.put(`${API_URL}/content/${item.id}`, formData, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      // Обновляем состояние
      setSuccess(true);
      setLoading(false);

      // Вызываем функцию обновления списка контента
      onUpdate(response.data);

      // Закрываем модальное окно через 1 секунду
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Error updating content:', error);
      setError(error.response?.data?.error || 'Ошибка при обновлении контента');
      setLoading(false);
    }
  };

  // Форматирование размера файла
  const formatFileSize = (bytes) => {
    if (!bytes) return 'Неизвестно';
    const mb = bytes / (1024 * 1024);
    return mb.toFixed(2) + ' МБ';
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="edit-content-modal">
        <div className="modal-header">
          <h2>Редактирование контента</h2>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit} className="edit-form">
            <div className="form-group">
              <label htmlFor="title">Название*</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Введите название"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Описание</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Введите описание (необязательно)"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label htmlFor="compatibility">Совместимость</label>
              <textarea
                id="compatibility"
                value={compatibility}
                onChange={(e) => setCompatibility(e.target.value)}
                placeholder="Укажите с какими версиями программ совместим контент (каждая программа с новой строки)"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label htmlFor="cover_image">Обложка (изображение)</label>
              <div className="file-input-container">
                <input
                  type="file"
                  id="cover_image"
                  onChange={handleCoverImageChange}
                  className="file-input"
                  accept="image/*"
                />
                <div className="file-input-button">
                  <FaUpload /> Выбрать обложку
                </div>
                {coverImageName && (
                  <div className="file-info">
                    <span className="file-name">{coverImageName}</span>
                    <span className="file-size">{formatFileSize(coverImageSize)}</span>
                  </div>
                )}
              </div>
              {coverImagePreview && (
                <div className="cover-preview">
                  <img src={coverImagePreview} alt="Предпросмотр обложки" />
                </div>
              )}
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="save-button"
                disabled={loading}
              >
                {loading ? <FaSpinner className="spinner" /> : <><FaSave /> Сохранить</>}
              </button>
            </div>

            {error && (
              <div className="error-message">
                <FaTimes />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="success-message">
                <FaCheck />
                <span>Информация о контенте успешно обновлена</span>
              </div>
            )}
          </form>

          <div className="examples-section">
            <h3>Примеры</h3>

            <div className="add-example-form">
              <div className="form-group">
                <label htmlFor="exampleTitle">Название примера</label>
                <input
                  type="text"
                  id="exampleTitle"
                  value={exampleTitle}
                  onChange={(e) => setExampleTitle(e.target.value)}
                  placeholder="Введите название примера (необязательно)"
                />
              </div>

              <div className="form-group">
                <label htmlFor="exampleFile">Файл примера (изображение или видео)</label>
                <div className="file-input-container">
                  <input
                    type="file"
                    id="exampleFile"
                    onChange={handleFileChange}
                    className="file-input"
                    accept="image/jpeg,image/png,image/gif,video/mp4,video/webm"
                  />
                  <div className="file-input-button">
                    <FaUpload /> Выбрать файл
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="add-example-button"
                onClick={handleAddExample}
                disabled={!selectedFile || uploadingExample}
              >
                {uploadingExample ? <FaSpinner className="spinner" /> : <><FaPlus /> Добавить пример</>}
              </button>
            </div>

            {loadingExamples ? (
              <div className="loading-examples">
                <FaSpinner className="spinner" />
                <span>Загрузка примеров...</span>
              </div>
            ) : examples.length === 0 ? (
              <div className="no-examples">
                <span>Примеры отсутствуют</span>
              </div>
            ) : (
              <div className="examples-list">
                <div className="examples-grid">
                  {examples.map(example => (
                    <div key={example.id} className="example-item">
                      <div className="example-preview">
                        {example.type === 'image' ? (
                          <img
                            src={resolveFileUrl(example.file_path, API_URL)}
                            alt={example.title || 'Пример'}
                          />
                        ) : (
                          <div className="video-placeholder">
                            <FaVideo />
                            <span>Видео</span>
                          </div>
                        )}
                      </div>
                      <div className="example-info">
                        <div className="example-title">
                          {example.type === 'image' ? <FaImage /> : <FaVideo />}
                          <span>{example.title || 'Без названия'}</span>
                        </div>
                        <button
                          className="delete-example-button"
                          onClick={() => handleDeleteExample(example.id)}
                          title="Удалить пример"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditContentModal;
