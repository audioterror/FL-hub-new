import React, { useState, useEffect } from 'react';
import { FaDownload, FaTimes, FaCalendarAlt, FaInfoCircle, FaCode, FaPlay, FaSpinner } from 'react-icons/fa';
import axios from 'axios';
import './ContentDetailsModal.css';
import SimpleMediaViewer from './SimpleMediaViewer';
import DownloadProgressModal from './DownloadProgressModal';
import { API_URL } from '../api/config';
import { resolveFileUrl } from '../utils/urlHelpers';

/**
 * Модальное окно для отображения подробной информации о контенте
 * @param {Object} props - Свойства компонента
 * @param {Object} props.item - Элемент контента
 * @param {Function} props.onClose - Функция закрытия модального окна
 * @returns {React.ReactNode}
 */
const ContentDetailsModal = ({ item, onClose }) => {
  // Состояние для примеров
  const [examples, setExamples] = useState([]);
  const [loadingExamples, setLoadingExamples] = useState(true);

  // Состояние для просмотра медиа
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);

  // Состояние для отслеживания прогресса скачивания
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadedBytes, setDownloadedBytes] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState('preparing');
  const [downloadError, setDownloadError] = useState('');
  const [downloadFileName, setDownloadFileName] = useState('');

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

  // Форматирование даты
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  };

  // Форматирование размера файла
  const formatFileSize = (bytes) => {
    if (!bytes) return 'Неизвестно';
    const mb = bytes / (1024 * 1024);
    return mb.toFixed(2) + ' МБ';
  };

  // Обработчик нажатия на кнопку скачивания
  const handleDownload = async () => {
    try {
      // Получаем токен из localStorage
      const authToken = localStorage.getItem('authToken');

      if (!authToken) {
        alert('Требуется авторизация');
        return;
      }

      // Проверяем, указан ли путь для скачивания данного типа контента
      const downloadPaths = JSON.parse(localStorage.getItem('downloadPaths') || '{}');
      const contentTypeMap = {
        'Preset': 'presets',
        'Plugin': 'plugins',
        'Font': 'fonts',
        'Sound': 'sounds',
        'Footage': 'footage',
        'Script': 'scripts',
        'Graphic': 'graphics',
        'Pack': 'packs'
      };

      const pathKey = contentTypeMap[item.type];
      if (!downloadPaths[pathKey]) {
        const goToSettings = window.confirm(
          `Не указан путь для скачивания ${item.type.toLowerCase()}. ` +
          'Перейти в настройки, чтобы указать путь?'
        );

        if (goToSettings) {
          window.location.hash = '/settings';
          return;
        } else {
          return;
        }
      }

      // Показываем уведомление о возможном ограничении скорости
      const userRole = localStorage.getItem('userRole');
      if (userRole === 'BASIC') {
        const upgradeToVip = window.confirm(
          'Ваша скорость скачивания ограничена до 200 КБ/с, так как у вас базовый аккаунт. ' +
          'Хотите получить VIP-статус для скачивания без ограничений?'
        );

        if (upgradeToVip) {
          alert('Для получения VIP-статуса обратитесь к администратору.');
          return;
        }
      }

      // Сбрасываем состояние скачивания
      setDownloadProgress(0);
      setDownloadedBytes(0);
      setDownloadSpeed(0);
      setDownloadStatus('preparing');
      setDownloadError('');
      setDownloadFileName(item.title || 'download');
      setShowDownloadModal(true);

      // Создаем объект XMLHttpRequest для отслеживания прогресса
      const xhr = new XMLHttpRequest();
      xhr.open('GET', `${API_URL}/content/${item.id}/stream-download`, true);
      xhr.responseType = 'blob';
      xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);

      // Переменные для расчета скорости
      let startTime = Date.now();
      let lastLoaded = 0;
      let speedUpdateInterval;

      // Обработчик прогресса
      xhr.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setDownloadProgress(progress);
          setDownloadedBytes(event.loaded);

          // Обновляем статус
          setDownloadStatus('downloading');

          // Расчет скорости скачивания
          const currentTime = Date.now();
          const elapsedTime = (currentTime - startTime) / 1000; // в секундах
          if (elapsedTime > 0) {
            const bytesPerSecond = event.loaded / elapsedTime;
            setDownloadSpeed(bytesPerSecond);
          }
        }
      };

      // Обновление скорости каждую секунду
      speedUpdateInterval = setInterval(() => {
        const currentTime = Date.now();
        const elapsedTimeSinceLastUpdate = (currentTime - startTime) / 1000;
        if (elapsedTimeSinceLastUpdate > 0) {
          const bytesLoadedSinceLastUpdate = xhr.response ? xhr.response.size - lastLoaded : 0;
          const currentSpeed = bytesLoadedSinceLastUpdate / elapsedTimeSinceLastUpdate;
          setDownloadSpeed(currentSpeed);

          // Обновляем для следующего расчета
          startTime = currentTime;
          lastLoaded = xhr.response ? xhr.response.size : 0;
        }
      }, 1000);

      // Обработчик завершения
      xhr.onload = () => {
        clearInterval(speedUpdateInterval);

        if (xhr.status === 200) {
          const blob = xhr.response;

          // Получаем расширение файла из заголовка Content-Disposition или URL
          const contentDisposition = xhr.getResponseHeader('Content-Disposition');
          let originalExt = '';
          let originalFileName = '';

          // Пытаемся получить оригинальное имя файла из заголовка
          if (contentDisposition) {
            const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
            if (fileNameMatch) {
              originalFileName = decodeURIComponent(fileNameMatch[1]);
              // Получаем расширение из оригинального имени файла
              const lastDotIndex = originalFileName.lastIndexOf('.');
              if (lastDotIndex !== -1) {
                originalExt = originalFileName.substring(lastDotIndex);
              }
            }
          }

          // Если не удалось получить расширение из заголовка, пытаемся получить из URL
          if (!originalExt) {
            // Пытаемся получить имя файла из URL
            const urlParts = item.file_path ? item.file_path.split('/') : [];
            if (urlParts.length > 0) {
              const urlFileName = urlParts[urlParts.length - 1].split('?')[0];
              const lastDotIndex = urlFileName.lastIndexOf('.');
              if (lastDotIndex !== -1) {
                originalExt = urlFileName.substring(lastDotIndex);
              }
            }
          }

          // Формируем имя файла из названия ресурса и оригинального расширения
          const fileName = (item.title || 'download') + (originalExt || '');
          setDownloadFileName(fileName);

          // Создаем временный URL для blob
          const url = URL.createObjectURL(blob);

          // Устанавливаем статус завершения
          setDownloadStatus('completed');
          setDownloadProgress(100);

          // В Electron можно использовать путь для сохранения файла
          // Для веб-версии используем стандартный механизм скачивания
          if (window.electron) {
            // Electron-специфичный код для сохранения файла по указанному пути
            try {
              console.log(`Файл будет сохранен в: ${downloadPaths[pathKey]}/${fileName}`);

              // Фактическое сохранение файла через Electron API
              if (window.electron && window.electron.saveFile) {
                // Создаем папку с названием ресурса
                const folderName = item.title.replace(/[\\/:*?"<>|]/g, '_'); // Заменяем недопустимые символы
                const fullPath = `${downloadPaths[pathKey]}/${folderName}`;

                // Преобразуем Blob в ArrayBuffer для передачи в main process
                const reader = new FileReader();
                reader.onload = async function() {
                  try {
                    const arrayBuffer = reader.result;

                    // Сначала создаем директорию, если она не существует
                    if (window.electron.createDirectory) {
                      const dirExists = await window.electron.pathExists(fullPath);
                      if (!dirExists) {
                        await window.electron.createDirectory(fullPath);
                        console.log(`Создана директория: ${fullPath}`);
                      }
                    }

                    // Сохраняем файл в созданную директорию
                    const result = await window.electron.saveFile(arrayBuffer, fullPath, fileName);

                    if (result.success) {
                      console.log(`Файл успешно сохранен: ${result.path}`);
                    } else {
                      console.error(`Ошибка при сохранении файла: ${result.error}`);
                      // Fallback на стандартный механизм скачивания
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = fileName;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }
                  } catch (error) {
                    console.error('Ошибка при сохранении файла через Electron API:', error);
                    // Fallback на стандартный механизм скачивания
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }
                };
                reader.readAsArrayBuffer(blob);
              } else {
                // Если API не доступно, используем стандартный механизм
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              }
            } catch (error) {
              console.error('Error saving file with Electron:', error);
              // Fallback на стандартный механизм скачивания
              const a = document.createElement('a');
              a.href = url;
              a.download = fileName;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }
          } else {
            // Стандартный механизм скачивания для веб-версии
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }

          // Освобождаем URL
          setTimeout(() => {
            URL.revokeObjectURL(url);
          }, 100);
        } else {
          setDownloadStatus('error');
          setDownloadError(`Ошибка при скачивании: ${xhr.status} ${xhr.statusText}`);
        }
      };

      // Обработчик ошибки
      xhr.onerror = (error) => {
        clearInterval(speedUpdateInterval);
        console.error('Error downloading file:', error);
        setDownloadStatus('error');
        setDownloadError('Ошибка сети при скачивании файла');
      };

      // Отправляем запрос
      xhr.send();
    } catch (error) {
      console.error('Error downloading file:', error);
      setDownloadStatus('error');
      setDownloadError(error.message);
    }
  };

  // Обработчик закрытия модального окна скачивания
  const handleCloseDownloadModal = () => {
    setShowDownloadModal(false);
  };

  // Обработчик клика вне модального окна
  const handleBackdropClick = (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="content-details-modal">
        <div className="modal-header">
          <h2>{item.title}</h2>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          <div className="content-main-layout">
            {/* Левая колонка с обложкой */}
            <div className="content-left-column">
              {item.cover_image ? (
                <div className="cover-image-container">
                  <img src={resolveFileUrl(item.cover_image, API_URL)} alt={item.title} className="cover-image" />
                </div>
              ) : (
                <div className="cover-placeholder">
                  <span className="cover-letter">{item.title.charAt(0).toUpperCase()}</span>
                </div>
              )}
              
              <button className="download-button-large" onClick={handleDownload}>
                <FaDownload /> Скачать
              </button>
            </div>

            {/* Правая колонка с информацией */}
            <div className="content-right-column">
              <div className="info-section">
                <h3><FaInfoCircle /> Описание</h3>
                <p className="content-description">
                  {item.description || 'Описание отсутствует'}
                </p>
              </div>

              <div className="info-section">
                <h3><FaCalendarAlt /> Информация</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Тип:</span>
                    <span className="info-value">{item.type}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Размер:</span>
                    <span className="info-value">{formatFileSize(item.size)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Дата добавления:</span>
                    <span className="info-value">{formatDate(item.created_at)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Добавил:</span>
                    <span className="info-value">{item.uploader_name || 'Неизвестно'}</span>
                  </div>
                </div>
              </div>

              <div className="info-section">
                <h3><FaCode /> Совместимость</h3>
                {item.compatibility ? (
                  <ul className="compatibility-list">
                    {item.compatibility.split('\n').map((program, index) => (
                      program.trim() && <li key={index} className="compatibility-item">{program.trim()}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="content-compatibility">
                    Информация о совместимости отсутствует
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Галерея с примерами */}
          <div className="content-gallery">
            <h3>Примеры</h3>

            {loadingExamples ? (
              <div className="gallery-loading">
                <FaSpinner className="spinner" />
                <p>Загрузка примеров...</p>
              </div>
            ) : examples.length === 0 ? (
              <div className="gallery-placeholder">
                <p>Примеры отсутствуют</p>
              </div>
            ) : (
              <div className="gallery-grid">
                {examples.map((example, index) => (
                  <div key={example.id} className="gallery-item">
                    <div
                      className="gallery-item-preview"
                      onClick={() => {
                        setSelectedMediaIndex(index);
                        setShowMediaViewer(true);
                      }}
                    >
                      {example.type === 'image' ? (
                        <img
                          src={resolveFileUrl(example.file_path, API_URL)}
                          alt=""
                        />
                      ) : (
                        <div className="video-preview">
                          <div className="play-icon"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Просмотрщик медиа */}
      {showMediaViewer && (
        <SimpleMediaViewer
          media={{
            type: examples[selectedMediaIndex].type,
            url: resolveFileUrl(examples[selectedMediaIndex].file_path, API_URL)
          }}
          onClose={() => setShowMediaViewer(false)}
        />
      )}

      {/* Модальное окно прогресса скачивания */}
      <DownloadProgressModal
        isOpen={showDownloadModal}
        onClose={handleCloseDownloadModal}
        fileName={downloadFileName}
        fileSize={item.size || 0}
        progress={downloadProgress}
        downloadedBytes={downloadedBytes}
        speed={downloadSpeed}
        status={downloadStatus}
        error={downloadError}
      />
    </div>
  );
};

export default ContentDetailsModal;
