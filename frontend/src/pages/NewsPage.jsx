import React, { useState, useEffect } from 'react';
import { FaSpinner, FaTimes, FaCalendarAlt } from 'react-icons/fa';
import axios from 'axios';
import { API_URL } from '../api/config';
import './NewsPage.css';

const NewsPage = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNews, setSelectedNews] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Загрузка новостей
  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/news?page=${page}&limit=5`);

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

        // В любом случае завершаем загрузку
        setLoading(false);
      } catch (error) {
        console.error('Error fetching news:', error);

        // Если ошибка 404, значит новостей просто нет
        if (error.response && error.response.status === 404) {
          setNews([]);
          setError(null);
        } else {
          setError('Ошибка при загрузке новостей. Пожалуйста, попробуйте позже.');
        }

        setLoading(false);
      }
    };

    // Устанавливаем таймаут для предотвращения бесконечной загрузки
    const timeoutId = setTimeout(fetchNews, 100);

    // Если загрузка длится более 10 секунд, прекращаем её
    const loadingTimeoutId = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setNews([]);
        console.log('Loading timeout reached, assuming no news available');
      }
    }, 10000);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(loadingTimeoutId);
    };
  }, [page]);

  // Загрузка полной новости
  const handleNewsClick = async (newsId) => {
    if (selectedNews && selectedNews.id === newsId) {
      // Если уже выбрана эта новость, закрываем её
      setSelectedNews(null);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/news/${newsId}`);
      setSelectedNews(response.data);
    } catch (error) {
      console.error('Error fetching news details:', error);
      setError('Ошибка при загрузке новости. Пожалуйста, попробуйте позже.');
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

  // Обработка пагинации
  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  // Закрыть детальный просмотр новости
  const closeNewsDetail = () => {
    setSelectedNews(null);
  };

  return (
    <div className="news-page">
      <h1 className="news-page-title">Новости и обновления</h1>

      {loading ? (
        <div className="news-loading">
          <FaSpinner className="spinner" />
          <span>Загрузка новостей...</span>
        </div>
      ) : error ? (
        <div className="news-error">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Попробовать снова</button>
        </div>
      ) : (
        <div className="news-container">
          <div className="news-list">
            {news.length === 0 ? (
              <div className="no-news">
                <p>Новостей пока нет</p>
              </div>
            ) : (
              news.map((item) => (
                <div
                  key={item.id}
                  className={`news-item ${selectedNews && selectedNews.id === item.id ? 'active' : ''}`}
                  onClick={() => handleNewsClick(item.id)}
                >
                  {item.image_url && (
                    <div className="news-thumbnail">
                      <img src={item.image_url} alt={item.title} />
                    </div>
                  )}
                  <div className="news-content">
                    <h2 className="news-title">{item.title}</h2>
                    <p className="news-subtitle">{item.subtitle}</p>
                    <div className="news-meta">
                      <span className="news-date">
                        <FaCalendarAlt /> {formatDate(item.created_at)}
                      </span>
                      {item.author && (
                        <span className="news-author">
                          Автор: {item.author.first_name} {item.author.last_name || ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}

            {totalPages > 1 && (
              <div className="news-pagination">
                <button
                  className="pagination-button"
                  onClick={handlePrevPage}
                  disabled={page === 1}
                >
                  Предыдущая
                </button>
                <span className="pagination-info">
                  Страница {page} из {totalPages}
                </span>
                <button
                  className="pagination-button"
                  onClick={handleNextPage}
                  disabled={page === totalPages}
                >
                  Следующая
                </button>
              </div>
            )}
          </div>

          {selectedNews && (
            <div className="news-detail-overlay">
              <div className="news-detail">
                <button className="close-button" onClick={closeNewsDetail}>
                  <FaTimes />
                </button>
                <h2 className="detail-title">{selectedNews.title}</h2>
                <p className="detail-subtitle">{selectedNews.subtitle}</p>

                <div className="detail-meta">
                  <span className="detail-date">
                    <FaCalendarAlt /> {formatDate(selectedNews.created_at)}
                  </span>
                  {selectedNews.author && (
                    <span className="detail-author">
                      Автор: {selectedNews.author.first_name} {selectedNews.author.last_name || ''}
                    </span>
                  )}
                </div>

                {selectedNews.image_url && (
                  <div className="detail-image">
                    <img src={selectedNews.image_url} alt={selectedNews.title} />
                  </div>
                )}

                {selectedNews.video_url && (
                  <div className="detail-video">
                    <video controls>
                      <source src={selectedNews.video_url} type="video/mp4" />
                      Ваш браузер не поддерживает видео.
                    </video>
                  </div>
                )}

                <div className="detail-content">
                  {selectedNews.content ? (
                    <div dangerouslySetInnerHTML={{ __html: selectedNews.content.replace(/\n/g, '<br>') }} />
                  ) : (
                    <p>Нет дополнительной информации</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NewsPage;
