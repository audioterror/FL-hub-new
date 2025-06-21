import React, { useEffect, useState, useRef } from 'react';
import { FaTimes, FaDownload, FaExclamationTriangle } from 'react-icons/fa';
import './DownloadProgressModal.css';

/**
 * Компонент модального окна для отображения прогресса скачивания файла
 * 
 * @param {Object} props - Свойства компонента
 * @param {boolean} props.isOpen - Флаг, указывающий, открыто ли модальное окно
 * @param {Function} props.onClose - Функция, вызываемая при закрытии модального окна
 * @param {string} props.fileName - Имя скачиваемого файла
 * @param {number} props.fileSize - Размер файла в байтах
 * @param {number} props.progress - Прогресс скачивания (от 0 до 100)
 * @param {number} props.downloadedBytes - Количество скачанных байт
 * @param {number} props.speed - Скорость скачивания в байтах в секунду
 * @param {string} props.status - Статус скачивания ('preparing', 'downloading', 'completed', 'error')
 * @param {string} props.error - Сообщение об ошибке (если status === 'error')
 */
const DownloadProgressModal = ({
  isOpen,
  onClose,
  fileName = 'file.zip',
  fileSize = 0,
  progress = 0,
  downloadedBytes = 0,
  speed = 0,
  status = 'preparing',
  error = ''
}) => {
  const [canClose, setCanClose] = useState(false);
  const modalRef = useRef(null);

  // Форматирование размера файла
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Форматирование скорости скачивания
  const formatSpeed = (bytesPerSecond) => {
    if (bytesPerSecond === 0) return '0 KB/s';
    if (bytesPerSecond < 1024 * 1024) {
      return `${(bytesPerSecond / 1024).toFixed(2)} KB/s`;
    } else {
      return `${(bytesPerSecond / (1024 * 1024)).toFixed(2)} MB/s`;
    }
  };

  // Расчет оставшегося времени
  const calculateTimeRemaining = () => {
    if (speed === 0 || downloadedBytes >= fileSize) return 'Завершено';
    const remainingBytes = fileSize - downloadedBytes;
    const remainingSeconds = remainingBytes / speed;
    
    if (remainingSeconds < 60) {
      return `${Math.ceil(remainingSeconds)} сек`;
    } else if (remainingSeconds < 3600) {
      return `${Math.floor(remainingSeconds / 60)} мин ${Math.ceil(remainingSeconds % 60)} сек`;
    } else {
      const hours = Math.floor(remainingSeconds / 3600);
      const minutes = Math.floor((remainingSeconds % 3600) / 60);
      return `${hours} ч ${minutes} мин`;
    }
  };

  // Получение статусного сообщения
  const getStatusMessage = () => {
    switch (status) {
      case 'preparing':
        return 'Подготовка к скачиванию...';
      case 'downloading':
        return `Скачивание... ${formatSpeed(speed)} - Осталось: ${calculateTimeRemaining()}`;
      case 'completed':
        return 'Скачивание завершено';
      case 'error':
        return `Ошибка: ${error}`;
      default:
        return 'Подготовка к скачиванию...';
    }
  };

  // Разрешаем закрытие модального окна только после завершения скачивания или при ошибке
  useEffect(() => {
    setCanClose(status === 'completed' || status === 'error');
  }, [status]);

  // Обработчик клика вне модального окна
  const handleBackdropClick = (e) => {
    if (canClose && e.target === modalRef.current) {
      onClose();
    }
  };

  // Если модальное окно не открыто, не рендерим его
  if (!isOpen) return null;

  return (
    <div 
      className="download-modal-backdrop" 
      ref={modalRef}
      onClick={handleBackdropClick}
    >
      <div className="download-modal-content">
        <div className="download-modal-header">
          <h2>
            <FaDownload className="download-icon" /> 
            Скачивание файла
          </h2>
          {canClose && (
            <button className="close-button" onClick={onClose}>
              <FaTimes />
            </button>
          )}
        </div>
        
        <div className="download-modal-body">
          <div className="download-file-info">
            <div className="download-file-name" title={fileName}>
              {fileName}
            </div>
            <div className="download-file-size">
              {formatFileSize(downloadedBytes)} / {formatFileSize(fileSize)}
            </div>
          </div>
          
          <div className="progress-bar-container">
            <div 
              className="progress-bar" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          <div className={`download-status ${status === 'error' ? 'error' : ''}`}>
            {status === 'error' ? (
              <div className="error-message">
                <FaExclamationTriangle /> {getStatusMessage()}
              </div>
            ) : (
              getStatusMessage()
            )}
          </div>
        </div>
        
        {canClose && (
          <div className="download-modal-footer">
            <button 
              className="close-download-button"
              onClick={onClose}
            >
              Закрыть
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DownloadProgressModal;
