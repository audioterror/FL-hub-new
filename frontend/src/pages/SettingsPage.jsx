import React, { useState, useEffect } from 'react';
import { FaCog, FaFolder, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import './SettingsPage.css';

const SettingsPage = () => {
  // Типы контента, для которых нужно указать пути
  const contentTypes = [
    { id: 'presets', name: 'Пресеты', defaultPath: '' },
    { id: 'plugins', name: 'Плагины', defaultPath: '' },
    { id: 'fonts', name: 'Шрифты', defaultPath: '' },
    { id: 'sounds', name: 'Звуки', defaultPath: '' },
    { id: 'footage', name: 'Футажи', defaultPath: '' },
    { id: 'scripts', name: 'Скрипты', defaultPath: '' },
    { id: 'graphics', name: 'Графика', defaultPath: '' },
    { id: 'packs', name: 'Паки', defaultPath: '' }
  ];

  // Состояние для хранения путей
  const [downloadPaths, setDownloadPaths] = useState({});
  const [saveStatus, setSaveStatus] = useState({ show: false, success: false, message: '' });

  // Загрузка сохраненных путей при монтировании компонента
  useEffect(() => {
    const savedPaths = localStorage.getItem('downloadPaths');
    if (savedPaths) {
      try {
        setDownloadPaths(JSON.parse(savedPaths));
      } catch (error) {
        console.error('Error parsing saved paths:', error);
        setDownloadPaths({});
      }
    }
  }, []);

  // Обработчик изменения пути
  const handlePathChange = (typeId, value) => {
    setDownloadPaths(prev => ({
      ...prev,
      [typeId]: value
    }));
  };

  // Обработчик выбора папки
  const handleSelectFolder = async (typeId) => {
    try {
      // Проверяем, доступен ли Electron API
      if (window.electron && window.electron.selectDirectory) {
        // Используем Electron API для выбора директории
        const result = await window.electron.selectDirectory({
          title: 'Выберите папку для ' + contentTypes.find(t => t.id === typeId).name,
          defaultPath: downloadPaths[typeId] || ''
        });

        if (result && !result.canceled && result.filePaths.length > 0) {
          handlePathChange(typeId, result.filePaths[0]);
        }
      } else {
        // Для веб-версии используем имитацию
        const selectedPath = prompt('Введите путь к папке для ' + contentTypes.find(t => t.id === typeId).name);

        if (selectedPath) {
          handlePathChange(typeId, selectedPath);
        }

        // Показываем сообщение о том, что эта функция полноценно работает только в десктопной версии
        alert('Примечание: Полноценный выбор папки доступен только в десктопной версии приложения.');
      }
    } catch (error) {
      console.error('Error selecting folder:', error);
      alert('Произошла ошибка при выборе папки: ' + error.message);
    }
  };

  // Сохранение настроек
  const saveSettings = () => {
    try {
      localStorage.setItem('downloadPaths', JSON.stringify(downloadPaths));
      setSaveStatus({
        show: true,
        success: true,
        message: 'Настройки успешно сохранены'
      });

      // Скрываем сообщение через 3 секунды
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, show: false }));
      }, 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus({
        show: true,
        success: false,
        message: 'Ошибка при сохранении настроек'
      });
    }
  };

  return (
    <div className="settings-page">
      <div className="content-header">
        <h1><FaCog /> Настройки</h1>
      </div>

      <div className="settings-container">
        <div className="section-box">
          <div className="section-header">
            <h2>Пути для скачивания</h2>
          </div>
          <div className="section-content">
            <p className="settings-description">
              Укажите пути для скачивания различных типов файлов. Если путь не указан,
              вам будет предложено указать его при попытке скачать файл.
            </p>

            <div className="paths-list">
              {contentTypes.map(type => (
                <div className="path-item" key={type.id}>
                  <div className="path-label">{type.name}</div>
                  <div className="path-input-container">
                    <input
                      type="text"
                      className="path-input"
                      value={downloadPaths[type.id] || ''}
                      onChange={(e) => handlePathChange(type.id, e.target.value)}
                      placeholder={`Путь для ${type.name.toLowerCase()}`}
                    />
                    <button
                      className="folder-select-btn"
                      onClick={() => handleSelectFolder(type.id)}
                      title="Выбрать папку"
                    >
                      <FaFolder />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="settings-actions">
              <button className="save-settings-btn" onClick={saveSettings}>
                Сохранить настройки
              </button>
            </div>

            {saveStatus.show && (
              <div className={`save-status ${saveStatus.success ? 'success' : 'error'}`}>
                {saveStatus.success ? <FaCheck /> : <FaExclamationTriangle />}
                <span>{saveStatus.message}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
