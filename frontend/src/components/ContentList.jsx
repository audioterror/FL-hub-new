import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSpinner, FaSync } from 'react-icons/fa';
import ContentCard from './ContentCard';
import { useSearch } from '../contexts/SearchContext';
import { API_URL } from '../api/config';
import './ContentList.css';

const ContentList = ({ contentType }) => {
  // Состояние для списка контента
  const [contentList, setContentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Получаем поисковый запрос из контекста
  const { searchQuery } = useSearch();

  // Загрузка списка контента при монтировании компонента и при изменении типа контента
  useEffect(() => {
    fetchContentList();
  }, [contentType]);

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

      // Формируем URL с параметром типа контента
      const url = `${API_URL}/content${contentType ? `?type=${contentType}` : ''}`;

      try {
        // Выполняем запрос к API
        const response = await axios.get(url, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

        // Обновляем состояние
        setContentList(response.data);

        // Сохраняем количество контента в localStorage
        const totalCount = response.headers['x-total-content-count'] || response.data.length;
        localStorage.setItem('contentCount', totalCount.toString());
        console.log('Content count updated in localStorage:', totalCount);

        setLoading(false);
        setRefreshing(false);
      } catch (apiError) {
        // Обрабатываем ошибки API
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
        setRefreshing(false);
      }
    } catch (error) {
      console.error('Error in fetchContentList:', error);
      setError('Произошла непредвиденная ошибка. Пожалуйста, обновите страницу.');
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Обработчик обновления списка контента
  const handleRefresh = () => {
    setRefreshing(true);
    fetchContentList();
  };

  // Фильтрация списка контента по поисковому запросу
  const filteredContent = contentList.filter(item => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(query) ||
      (item.description && item.description.toLowerCase().includes(query))
    );
  });

  // Если идет загрузка, показываем индикатор загрузки
  if (loading && !refreshing) {
    return (
      <div className="loading-container">
        <FaSpinner className="spinner" />
        <p>Загрузка контента...</p>
      </div>
    );
  }

  // Если произошла ошибка, показываем сообщение об ошибке
  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button className="refresh-button" onClick={handleRefresh}>
          <FaSync /> Повторить
        </button>
      </div>
    );
  }

  // Если список пуст, показываем сообщение
  if (contentList.length === 0) {
    return (
      <div className="empty-container">
        <p className="empty-message">Нет ресурсов в этой категории.</p>
        <button className="refresh-button" onClick={handleRefresh}>
          <FaSync /> Обновить
        </button>
      </div>
    );
  }

  // Если поиск не дал результатов, показываем сообщение
  if (filteredContent.length === 0) {
    return (
      <div className="empty-container">
        <p className="empty-message">Ничего не найдено.</p>
        <button className="refresh-button" onClick={handleRefresh}>
          <FaSync /> Обновить
        </button>
      </div>
    );
  }

  // Отображаем список контента
  return (
    <div className="content-list-container">
      <div className="content-list-header">
        <div className="content-list-info">
          <span className="content-count">{filteredContent.length} элементов</span>
          {searchQuery && (
            <span className="search-info">
              Поиск: "{searchQuery}"
            </span>
          )}
        </div>
        <button
          className={`refresh-button ${refreshing ? 'refreshing' : ''}`}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <FaSync className={refreshing ? 'spinner' : ''} />
          {refreshing ? 'Обновление...' : 'Обновить'}
        </button>
      </div>

      <div className="content-grid">
        {filteredContent.map(item => (
          <ContentCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};

export default ContentList;
