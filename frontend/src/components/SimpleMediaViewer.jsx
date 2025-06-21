import React from 'react';
import { FaTimes } from 'react-icons/fa';
import './SimpleMediaViewer.css';

/**
 * Простой компонент для просмотра медиа-файлов (изображений и видео)
 * @param {Object} props - Свойства компонента
 * @param {Object} props.media - Медиа-файл для просмотра
 * @param {Function} props.onClose - Функция закрытия просмотрщика
 * @returns {React.ReactNode}
 */
const SimpleMediaViewer = ({ media, onClose }) => {
  // Обработчик клика вне модального окна
  const handleBackdropClick = (e) => {
    if (e.target.classList.contains('simple-media-backdrop')) {
      onClose();
    }
  };

  return (
    <div className="simple-media-backdrop" onClick={handleBackdropClick}>
      <div className="simple-media-container">
        <button className="simple-media-close" onClick={onClose}>
          <FaTimes />
        </button>
        
        {media.type === 'image' ? (
          <img 
            src={media.url} 
            alt="" 
            className="simple-media-content"
          />
        ) : (
          <video 
            src={media.url} 
            className="simple-media-content" 
            controls 
            autoPlay
          />
        )}
      </div>
    </div>
  );
};

export default SimpleMediaViewer;
