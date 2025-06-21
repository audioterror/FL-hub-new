import React, { useState } from 'react';
import {
  FaDownload,
  FaLayerGroup,
  FaBolt,
  FaFont,
  FaMusic,
  FaFilm,
  FaCode,
  FaPenNib,
  FaBox,
  FaInfoCircle,
  FaEye
} from 'react-icons/fa';
import ContentDetailsModal from './ContentDetailsModal';
import DownloadProgressModal from './DownloadProgressModal';
import { API_URL } from '../api/config';
import { resolveFileUrl } from '../utils/urlHelpers';
import './ContentCard.css';

// Компонент для отображения отдельного элемента контента
const ContentCard = ({ item }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadedBytes, setDownloadedBytes] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState('preparing');
  const [downloadError, setDownloadError] = useState('');

  // Получаем иконку в зависимости от типа контента
  const getTypeIcon = () => {
    switch (item.type) {
      case 'Preset':
        return <FaLayerGroup />;
      case 'Plugin':
        return <FaBolt />;
      case 'Font':
        return <FaFont />;
      case 'Sound':
        return <FaMusic />;
      case 'Footage':
        return <FaFilm />;
      case 'Script':
        return <FaCode />;
      case 'Graphic':
        return <FaPenNib />;
      case 'Pack':
        return <FaBox />;
      default:
        return <FaLayerGroup />;
    }
  };

  // Форматирование размера файла
  const formatFileSize = (bytes) => {
    if (!bytes) return 'Неизвестно';
    const mb = bytes / (1024 * 1024);
    return mb.toFixed(2) + ' МБ';
  };

  // Форматирование даты
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
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

      // Показываем индикатор загрузки на кнопке
      const downloadButton = document.getElementById(`download-button-${item.id}`);
      if (downloadButton) {
        downloadButton.disabled = true;
        downloadButton.innerHTML = '<span class="spinner"></span> Загрузка...';
      }

      // Сбрасываем состояние скачивания
      setDownloadProgress(0);
      setDownloadedBytes(0);
      setDownloadSpeed(0);
      setDownloadStatus('preparing');
      setDownloadError('');
      setShowDownloadModal(true);

      // Получаем информацию о файле
      const fileInfoResponse = await fetch(`${API_URL}/content/${item.id}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!fileInfoResponse.ok) {
        throw new Error(`Ошибка при получении информации о файле: ${fileInfoResponse.status}`);
      }

      const fileInfo = await fileInfoResponse.json();
      const fileSize = fileInfo.size || 0;

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

          // Получаем имя файла из заголовка Content-Disposition или используем название контента
          const contentDisposition = xhr.getResponseHeader('Content-Disposition');
          let fileName = item.title || 'download';

          if (contentDisposition) {
            const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
            if (fileNameMatch) {
              fileName = decodeURIComponent(fileNameMatch[1]);
            }
          }

          // Создаем временный URL для blob
          const url = URL.createObjectURL(blob);

          // Получаем путь для скачивания
          const downloadPath = downloadPaths[pathKey];

          // Устанавливаем статус завершения
          setDownloadStatus('completed');
          setDownloadProgress(100);

          // В Electron можно использовать путь для сохранения файла
          // Для веб-версии используем стандартный механизм скачивания
          if (window.electron) {
            // Electron-специфичный код для сохранения файла по указанному пути
            try {
              // Здесь должен быть код для сохранения файла через Electron API
              // Например: window.electron.saveFile(blob, downloadPath, fileName);
              console.log(`Файл будет сохранен в: ${downloadPath}/${fileName}`);
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

        // Восстанавливаем кнопку
        if (downloadButton) {
          downloadButton.disabled = false;
          downloadButton.innerHTML = '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M216 0h80c13.3 0 24 10.7 24 24v168h87.7c17.8 0 26.7 21.5 14.1 34.1L269.7 378.3c-7.5 7.5-19.8 7.5-27.3 0L90.1 226.1c-12.6-12.6-3.7-34.1 14.1-34.1H192V24c0-13.3 10.7-24 24-24zm296 376v112c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24V376c0-13.3 10.7-24 24-24h146.7l49 49c20.1 20.1 52.5 20.1 72.6 0l49-49H488c13.3 0 24 10.7 24 24zm-124 88c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20zm64 0c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20z"></path></svg> <span>Скачать</span>';
        }
      };

      // Обработчик ошибки
      xhr.onerror = (error) => {
        clearInterval(speedUpdateInterval);
        console.error('Error downloading file:', error);
        setDownloadStatus('error');
        setDownloadError('Ошибка сети при скачивании файла');

        // Восстанавливаем кнопку
        if (downloadButton) {
          downloadButton.disabled = false;
          downloadButton.innerHTML = '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M216 0h80c13.3 0 24 10.7 24 24v168h87.7c17.8 0 26.7 21.5 14.1 34.1L269.7 378.3c-7.5 7.5-19.8 7.5-27.3 0L90.1 226.1c-12.6-12.6-3.7-34.1 14.1-34.1H192V24c0-13.3 10.7-24 24-24zm296 376v112c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24V376c0-13.3 10.7-24 24-24h146.7l49 49c20.1 20.1 52.5 20.1 72.6 0l49-49H488c13.3 0 24 10.7 24 24zm-124 88c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20zm64 0c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20z"></path></svg> <span>Скачать</span>';
        }
      };

      // Отправляем запрос
      xhr.send();
    } catch (error) {
      console.error('Error downloading file:', error);
      setDownloadStatus('error');
      setDownloadError(error.message);

      // Восстанавливаем кнопку
      const downloadButton = document.getElementById(`download-button-${item.id}`);
      if (downloadButton) {
        downloadButton.disabled = false;
        downloadButton.innerHTML = '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M216 0h80c13.3 0 24 10.7 24 24v168h87.7c17.8 0 26.7 21.5 14.1 34.1L269.7 378.3c-7.5 7.5-19.8 7.5-27.3 0L90.1 226.1c-12.6-12.6-3.7-34.1 14.1-34.1H192V24c0-13.3 10.7-24 24-24zm296 376v112c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24V376c0-13.3 10.7-24 24-24h146.7l49 49c20.1 20.1 52.5 20.1 72.6 0l49-49H488c13.3 0 24 10.7 24 24zm-124 88c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20zm64 0c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20z"></path></svg> <span>Скачать</span>';
      }
    }
  };

  // Обработчик клика по карточке для открытия модального окна
  const handleCardClick = () => {
    setShowModal(true);
  };

  // Обработчик закрытия модального окна
  const handleCloseModal = () => {
    setShowModal(false);
  };

  // Обработчик закрытия модального окна скачивания
  const handleCloseDownloadModal = () => {
    setShowDownloadModal(false);
  };

  return (
    <>
      <div className="content-card" onClick={handleCardClick}>
        <div className="content-card-header">
          <div className="content-type">
            <span className="type-icon">{getTypeIcon()}</span>
            <span className="type-name">{item.type}</span>
          </div>
        </div>

        <div className="content-card-body">
          <div className="content-logo">
            {item.cover_image ? (
              <img src={resolveFileUrl(item.cover_image, API_URL)} alt={item.title} className="cover-image" />
            ) : (
              <span className="cover-letter">{item.title.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <h3 className="content-title">{item.title}</h3>
          <div className="content-meta">
            <span className="content-size">{formatFileSize(item.size)}</span>
            <span className="content-date">{formatDate(item.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Модальное окно с подробной информацией */}
      {showModal && (
        <ContentDetailsModal
          item={item}
          onClose={handleCloseModal}
        />
      )}

      {/* Модальное окно прогресса скачивания */}
      <DownloadProgressModal
        isOpen={showDownloadModal}
        onClose={handleCloseDownloadModal}
        fileName={item.title}
        fileSize={item.size || 0}
        progress={downloadProgress}
        downloadedBytes={downloadedBytes}
        speed={downloadSpeed}
        status={downloadStatus}
        error={downloadError}
      />
    </>
  );
};

export default ContentCard;
