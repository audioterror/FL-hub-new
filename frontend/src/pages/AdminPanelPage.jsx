import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUpload, FaTrash, FaDownload, FaSpinner, FaCheck, FaTimes, FaEdit, FaPlus, FaImage, FaVideo } from 'react-icons/fa';
import EditContentModal from '../components/EditContentModal';
import { API_URL } from '../api/config';
import './AdminPanelPage.css';

// API URL
// const API_URL = 'http://localhost:5000/api';

const AdminPanelPage = () => {
  // Состояние для формы добавления контента
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Preset');
  const [description, setDescription] = useState('');
  const [compatibility, setCompatibility] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(null);
  const [selectedCoverImage, setSelectedCoverImage] = useState(null);
  const [coverImageName, setCoverImageName] = useState('');
  const [coverImageSize, setCoverImageSize] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState(null);

  // Состояние для примеров
  const [examples, setExamples] = useState([]);
  const [exampleTitle, setExampleTitle] = useState('');
  const [selectedExampleFile, setSelectedExampleFile] = useState(null);
  const [exampleFileName, setExampleFileName] = useState('');
  const [exampleFileSize, setExampleFileSize] = useState(null);

  // Состояние для списка контента
  const [contentList, setContentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Состояние для уведомлений
  const [notification, setNotification] = useState(null);

  // Состояние для фильтрации
  const [filter, setFilter] = useState('');

  // Состояние для модального окна редактирования
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Загрузка списка контента при монтировании компонента
  useEffect(() => {
    fetchContentList();
  }, []);

  // Функция для загрузки списка контента
  const fetchContentList = async () => {
    try {
      setLoading(true);
      setError(null);

      // Получаем токен из localStorage
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        setError('Требуется авторизация');
        setLoading(false);
        return;
      }

      try {
        // Выполняем запрос к API
        const response = await axios.get(`${API_URL}/content`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

        // Обновляем состояние
        setContentList(response.data);
        setLoading(false);
      } catch (apiError) {
        console.error('API Error:', apiError);

        // Если ошибка связана с авторизацией (401 или 403)
        if (apiError.response && (apiError.response.status === 401 || apiError.response.status === 403)) {
          // Если токен недействителен или истек, удаляем его из localStorage
          if (apiError.response.data && apiError.response.data.error === 'Invalid or expired token') {
            localStorage.removeItem('authToken');
            setError('Сессия истекла. Пожалуйста, войдите снова.');
          } else {
            setError(apiError.response?.data?.error || 'Ошибка авторизации');
          }
        } else if (apiError.response && apiError.response.status === 500) {
          setError('Ошибка сервера. Пожалуйста, попробуйте позже.');
        } else if (apiError.code === 'ECONNREFUSED' || apiError.message.includes('Network Error')) {
          setError('Не удалось подключиться к серверу. Проверьте подключение к интернету или сервер может быть недоступен.');
        } else {
          setError(apiError.response?.data?.error || 'Ошибка при загрузке списка контента');
        }

        setLoading(false);
      }
    } catch (error) {
      console.error('Error in fetchContentList:', error);
      setError('Произошла непредвиденная ошибка. Пожалуйста, обновите страницу.');
      setLoading(false);
    }
  };

  // Обработчик изменения файла
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
      setFileSize(file.size);
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
  const handleExampleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Проверяем, что файл является изображением или видео
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) {
        alert('Пожалуйста, выберите изображение или видео');
        return;
      }

      setSelectedExampleFile(file);
      setExampleFileName(file.name);
      setExampleFileSize(file.size);
    }
  };

  // Обработчик добавления примера в список
  const handleAddExample = () => {
    if (!selectedExampleFile) {
      return;
    }

    const example = {
      file: selectedExampleFile,
      title: exampleTitle,
      fileName: exampleFileName,
      fileSize: exampleFileSize,
      type: selectedExampleFile.type.startsWith('image/') ? 'image' : 'video',
      id: Date.now() // временный ID для идентификации в списке
    };

    setExamples([...examples, example]);

    // Очищаем форму
    setExampleTitle('');
    setSelectedExampleFile(null);
    setExampleFileName('');
    setExampleFileSize(null);
  };

  // Обработчик удаления примера из списка
  const handleRemoveExample = (id) => {
    setExamples(examples.filter(example => example.id !== id));
  };

  // Форматирование совместимости в виде списка
  const formatCompatibility = (text) => {
    if (!text) return '';
    // Разделяем текст по переносам строки и фильтруем пустые строки
    return text.split('\n').filter(line => line.trim() !== '').join('\n');
  };

  // Обработчик отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Проверяем, что все обязательные поля заполнены
    if (!title || !type || !selectedFile) {
      setNotification({
        type: 'error',
        message: 'Пожалуйста, заполните все обязательные поля и выберите файл'
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Получаем токен из localStorage
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        setError('Требуется авторизация');
        setLoading(false);
        return;
      }

      // Создаем объект FormData для отправки файла
      const formData = new FormData();
      formData.append('title', title);
      formData.append('type', type);
      formData.append('description', description);
      formData.append('compatibility', formatCompatibility(compatibility));
      formData.append('file', selectedFile);
      
      // Добавляем обложку, если она выбрана
      if (selectedCoverImage) {
        formData.append('cover_image', selectedCoverImage);
      }

      // Выполняем запрос к API
      const response = await axios.post(`${API_URL}/content`, formData, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          // Content-Type не указываем, axios сам установит правильный заголовок для FormData
        }
      });

      // Получаем созданный контент
      const newContent = response.data;

      // Если есть примеры, загружаем их
      if (examples.length > 0) {
        try {
          // Загружаем каждый пример
          for (const example of examples) {
            const exampleFormData = new FormData();
            exampleFormData.append('title', example.title);
            exampleFormData.append('file', example.file);

            await axios.post(`${API_URL}/content-examples/${newContent.id}`, exampleFormData, {
              headers: {
                'Authorization': `Bearer ${authToken}`
              }
            });
          }
        } catch (exampleError) {
          console.error('Error uploading examples:', exampleError);
          // Продолжаем выполнение, даже если не удалось загрузить примеры
        }
      }

      // Обновляем список контента
      setContentList([newContent, ...contentList]);

      // Очищаем форму
      setTitle('');
      setType('Preset');
      setDescription('');
      setCompatibility('');
      setSelectedFile(null);
      setFileName('');
      setFileSize(null);
      setSelectedCoverImage(null);
      setCoverImageName('');
      setCoverImageSize(null);
      setCoverImagePreview(null);
      setExamples([]);

      // Показываем уведомление об успешной загрузке
      setNotification({
        type: 'success',
        message: 'Контент успешно загружен'
      });

      // Скрываем уведомление через 3 секунды
      setTimeout(() => {
        setNotification(null);
      }, 3000);

      setLoading(false);
    } catch (error) {
      console.error('Error uploading content:', error);
      setError(error.response?.data?.error || 'Ошибка при загрузке контента');
      setLoading(false);

      // Показываем уведомление об ошибке
      setNotification({
        type: 'error',
        message: error.response?.data?.error || 'Ошибка при загрузке контента'
      });

      // Скрываем уведомление через 3 секунды
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    }
  };

  // Обработчик открытия модального окна редактирования
  const handleEdit = (item) => {
    setEditingItem(item);
    setEditModalOpen(true);
  };

  // Обработчик закрытия модального окна редактирования
  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setEditingItem(null);
  };

  // Обработчик обновления контента
  const handleUpdateContent = (updatedItem) => {
    // Обновляем элемент в списке контента
    setContentList(contentList.map(item =>
      item.id === updatedItem.id ? updatedItem : item
    ));

    // Показываем уведомление об успешном обновлении
    setNotification({
      type: 'success',
      message: 'Информация о контенте успешно обновлена'
    });

    // Скрываем уведомление через 3 секунды
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Обработчик удаления контента
  const handleDelete = async (id) => {
    // Запрашиваем подтверждение
    if (!window.confirm('Вы уверены, что хотите удалить этот элемент?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Получаем токен из localStorage
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        setError('Требуется авторизация');
        setLoading(false);
        return;
      }

      // Выполняем запрос к API
      await axios.delete(`${API_URL}/content/${id}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      // Обновляем список контента
      setContentList(contentList.filter(item => item.id !== id));

      // Показываем уведомление об успешном удалении
      setNotification({
        type: 'success',
        message: 'Контент успешно удален'
      });

      // Скрываем уведомление через 3 секунды
      setTimeout(() => {
        setNotification(null);
      }, 3000);

      setLoading(false);
    } catch (error) {
      console.error('Error deleting content:', error);
      setError(error.response?.data?.error || 'Ошибка при удалении контента');
      setLoading(false);

      // Показываем уведомление об ошибке
      setNotification({
        type: 'error',
        message: error.response?.data?.error || 'Ошибка при удалении контента'
      });

      // Скрываем уведомление через 3 секунды
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    }
  };

  // Фильтрация списка контента
  const filteredContent = contentList.filter(item => {
    if (!filter) return true;
    return item.type === filter;
  });

  // Форматирование размера файла
  const formatFileSize = (bytes) => {
    if (!bytes) return 'Неизвестно';
    const mb = bytes / (1024 * 1024);
    return mb.toFixed(2) + ' МБ';
  };

  return (
    <>
      <div className="content-header">
        <h1>Администрирование</h1>
      </div>

      {/* Уведомление */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.type === 'success' ? <FaCheck /> : <FaTimes />}
          <span>{notification.message}</span>
        </div>
      )}

      <div className="admin-panel">
        {/* Форма добавления контента */}
        <div className="section-box">
          <div className="section-header">
            <h2>Добавить контент</h2>
          </div>
          <div className="section-content">
            <form onSubmit={handleSubmit} className="content-form">
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
                <label htmlFor="type">Тип*</label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  required
                >
                  <option value="Preset">Пресет</option>
                  <option value="Plugin">Плагин</option>
                  <option value="Font">Шрифт</option>
                  <option value="Sound">Звук</option>
                  <option value="Footage">Футаж</option>
                  <option value="Script">Скрипт</option>
                  <option value="Graphic">Графика</option>
                  <option value="Pack">Пак</option>
                </select>
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
                <label htmlFor="file">Файл*</label>
                <div className="file-input-container">
                  <input
                    type="file"
                    id="file"
                    onChange={handleFileChange}
                    className="file-input"
                    required
                  />
                  <div className="file-input-button">
                    <FaUpload /> Выбрать файл
                  </div>
                  {fileName && (
                    <div className="file-info">
                      <span className="file-name">{fileName}</span>
                      <span className="file-size">{formatFileSize(fileSize)}</span>
                    </div>
                  )}
                </div>
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

              {/* Секция примеров */}
              <div className="examples-section">
                <h3>Примеры</h3>

                {/* Форма добавления примера */}
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
                        onChange={handleExampleFileChange}
                        className="file-input"
                        accept="image/jpeg,image/png,image/gif,video/mp4,video/webm"
                      />
                      <div className="file-input-button">
                        <FaUpload /> Выбрать файл
                      </div>
                      {exampleFileName && (
                        <div className="file-info">
                          <span className="file-name">{exampleFileName}</span>
                          <span className="file-size">{formatFileSize(exampleFileSize)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="add-example-button"
                    onClick={handleAddExample}
                    disabled={!selectedExampleFile}
                  >
                    <FaPlus /> Добавить пример
                  </button>
                </div>

                {/* Список добавленных примеров */}
                {examples.length > 0 && (
                  <div className="examples-list">
                    <h4>Добавленные примеры</h4>
                    <div className="examples-grid">
                      {examples.map(example => (
                        <div key={example.id} className="example-item">
                          <div className="example-preview">
                            {example.type === 'image' ? (
                              <img
                                src={URL.createObjectURL(example.file)}
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
                              onClick={() => handleRemoveExample(example.id)}
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

              <button type="submit" className="submit-button" disabled={loading}>
                {loading ? <FaSpinner className="spinner" /> : 'Загрузить'}
              </button>
            </form>
          </div>
        </div>

        {/* Список контента */}
        <div className="section-box">
          <div className="section-header">
            <h2>Список контента</h2>
            <div className="filter-container">
              <label htmlFor="filter">Фильтр:</label>
              <select
                id="filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="">Все</option>
                <option value="Preset">Пресеты</option>
                <option value="Plugin">Плагины</option>
                <option value="Font">Шрифты</option>
                <option value="Sound">Звуки</option>
                <option value="Footage">Футажи</option>
                <option value="Script">Скрипты</option>
                <option value="Graphic">Графика</option>
                <option value="Pack">Паки</option>
              </select>
            </div>
          </div>
          <div className="section-content">
            {loading && (
              <div className="loading-indicator">
                <FaSpinner className="spinner" />
                <span>Загрузка...</span>
              </div>
            )}

            {error && (
              <div className="error-container">
                <div className="error-message">
                  <FaTimes />
                  <span>{error}</span>
                </div>
                <button
                  className="retry-button"
                  onClick={fetchContentList}
                  disabled={loading}
                >
                  {loading ? <FaSpinner className="spinner" /> : 'Повторить попытку'}
                </button>
              </div>
            )}

            {!loading && !error && filteredContent.length === 0 && (
              <div className="empty-message">
                <span>Нет доступного контента</span>
              </div>
            )}

            {!loading && !error && filteredContent.length > 0 && (
              <div className="content-list">
                <table>
                  <thead>
                    <tr>
                      <th>Название</th>
                      <th>Тип</th>
                      <th>Размер</th>
                      <th>Загрузил</th>
                      <th>Дата</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContent.map((item) => (
                      <tr key={item.id}>
                        <td>{item.title}</td>
                        <td>{item.type}</td>
                        <td>{formatFileSize(item.size)}</td>
                        <td>{item.uploader_name || 'Неизвестно'}</td>
                        <td>{new Date(item.created_at).toLocaleDateString()}</td>
                        <td className="actions">
                          <button
                            className="action-button download"
                            onClick={() => window.open(`${API_URL}/content/${item.id}/download`, '_blank')}
                            title="Скачать"
                          >
                            <FaDownload />
                          </button>
                          <button
                            className="action-button edit"
                            onClick={() => handleEdit(item)}
                            title="Редактировать"
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="action-button delete"
                            onClick={() => handleDelete(item.id)}
                            title="Удалить"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Модальное окно редактирования */}
      {editModalOpen && editingItem && (
        <EditContentModal
          item={editingItem}
          onClose={handleCloseEditModal}
          onUpdate={handleUpdateContent}
        />
      )}
    </>
  );
};

export default AdminPanelPage;
