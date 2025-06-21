import { FaSearch, FaBell, FaCog, FaInfoCircle, FaWindowMinimize, FaSquare, FaTimes, FaTimes as FaClose } from 'react-icons/fa';
import { useSearch } from '../contexts/SearchContext';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import './TopBar.css';

const TopBar = () => {
  const { searchQuery, updateSearchQuery, clearSearchQuery } = useSearch();
  const location = useLocation();

  // Очищаем поисковый запрос при изменении маршрута
  useEffect(() => {
    clearSearchQuery();
  }, [location.pathname, clearSearchQuery]);

  // Обработчик изменения поискового запроса
  const handleSearchChange = (e) => {
    updateSearchQuery(e.target.value);
  };

  // Обработчик очистки поискового запроса
  const handleClearSearch = () => {
    clearSearchQuery();
  };

  return (
    <header className="header">
      <div className="search-container">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Поиск ресурсов..."
          className="search-input"
          value={searchQuery}
          onChange={handleSearchChange}
        />
        {searchQuery && (
          <button className="clear-search-btn" onClick={handleClearSearch}>
            <FaClose />
          </button>
        )}
      </div>

      <div className="user-controls">
        <button className="icon-btn" onClick={() => window.location.hash = '/settings'} title="Настройки">
          <FaCog />
        </button>
      </div>

      <div className="window-controls">
        <button
          className="window-btn minimize"
          onClick={() => {
            // Проверяем, доступен ли Electron API
            if (window.electron && window.electron.windowControl) {
              window.electron.windowControl('minimize');
            } else {
              console.log('Minimize window - Electron API not available');
            }
          }}
          title="Свернуть"
        >
          <FaWindowMinimize />
        </button>
        <button
          className="window-btn maximize"
          onClick={() => {
            // Проверяем, доступен ли Electron API
            if (window.electron && window.electron.windowControl) {
              window.electron.windowControl('maximize');
            } else {
              console.log('Maximize window - Electron API not available');
            }
          }}
          title="Развернуть"
        >
          <FaSquare />
        </button>
        <button
          className="window-btn close"
          onClick={() => {
            // Проверяем, доступен ли Electron API
            if (window.electron && window.electron.windowControl) {
              window.electron.windowControl('close');
            } else {
              console.log('Close window - Electron API not available');
            }
          }}
          title="Закрыть"
        >
          <FaTimes />
        </button>
      </div>
    </header>
  );
};

export default TopBar;
