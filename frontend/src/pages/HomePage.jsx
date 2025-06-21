import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { FaCrown, FaNewspaper, FaSpinner, FaChevronDown, FaChevronUp, FaInfoCircle, FaTimes, FaCalendarAlt } from 'react-icons/fa';
import PaymentModal from '../components/PaymentModal';
import { API_URL } from '../api/config';
import axios from 'axios';
import './HomePage.css';

const HomePage = () => {
  // Состояние для отображения дополнительных планов
  const [showMorePlans, setShowMorePlans] = useState(false);

  // Состояние для модального окна оплаты
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Состояние для новостей
  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState(null);
  const [selectedNews, setSelectedNews] = useState(null);

  // Загрузка новостей при монтировании компонента
  useEffect(() => {
    // Создаем переменную для отслеживания, смонтирован ли компонент
    let isMounted = true;

    const fetchNews = async () => {
      try {
        setNewsLoading(true);
        const response = await axios.get(`${API_URL}/news?page=1&limit=10`);

        // Проверяем, что компонент все еще смонтирован
        if (!isMounted) return;

        // Проверяем, что ответ содержит ожидаемые данные
        if (response.data && Array.isArray(response.data.news)) {
          console.log('Received news:', response.data.news);
          setNews(response.data.news);
        } else {
          // Если структура ответа не соответствует ожидаемой, считаем что новостей нет
          console.log('Unexpected response format:', response.data);
          setNews([]);
        }

        setNewsLoading(false);
      } catch (error) {
        // Проверяем, что компонент все еще смонтирован
        if (!isMounted) return;

        console.error('Error fetching news:', error);
        setNews([]);
        setNewsLoading(false);
      }
    };

    // Вызываем функцию загрузки новостей сразу
    fetchNews();

    // Отключаем таймаут, который мог приводить к пропаданию новостей

    // Очищаем таймаут и устанавливаем isMounted = false при размонтировании компонента
    return () => {
      isMounted = false;
    };
  }, []);

  // Планы подписки
  const plans = [
    {
      id: 1,
      name: '1 месяц',
      months: 1,
      price: 249,
      discount: 0,
      description: 'Идеально для короткого проекта'
    },
    {
      id: 3,
      name: '3 месяца',
      months: 3,
      price: 649,
      discount: 15,
      description: 'Выгоднее на 15%'
    },
    {
      id: 6,
      name: '6 месяцев',
      months: 6,
      price: 1119,
      discount: 25,
      description: 'Выгоднее на 25%'
    },
    {
      id: 9,
      name: '9 месяцев',
      months: 9,
      price: 1499,
      discount: 30,
      description: 'Выгоднее на 30%'
    },
    {
      id: 12,
      name: '12 месяцев',
      months: 12,
      price: 1799,
      discount: 35,
      description: 'Выгоднее на 35%'
    }
  ];

  // Обработчик нажатия на кнопку "Купить VIP"
  const handleBuyVIP = (plan) => {
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  // Обработчик закрытия модального окна
  const handleCloseModal = () => {
    setShowPaymentModal(false);
    setSelectedPlan(null);
  };

  // Обработчик клика по новости
  const handleNewsClick = async (newsId) => {
    // Если уже выбрана эта новость, закрываем её
    if (selectedNews && selectedNews.id === newsId) {
      setSelectedNews(null);
      return;
    }

    try {
      console.log('Fetching news details for ID:', newsId);
      const response = await axios.get(`${API_URL}/news/${newsId}`);
      console.log('News details received:', response.data);

      // Проверяем, что получили корректные данные
      if (response.data && response.data.id) {
        setSelectedNews(response.data);
      } else {
        console.error('Invalid news data received:', response.data);
        setNewsError('Ошибка при загрузке новости: некорректные данные');
      }
    } catch (error) {
      console.error('Error fetching news details:', error);
      setNewsError('Ошибка при загрузке новости');
    }
  };

  // Закрытие детальной информации о новости
  const closeNewsDetail = () => {
    setSelectedNews(null);
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
    }).replace(',', '');
  };

  // Рендер новостей
  const renderNews = () => {
    if (newsLoading) {
      return (
        <div className="loading-indicator">
          <FaSpinner className="spinner-icon" />
          <span>Загрузка новостей...</span>
        </div>
      );
    }

    if (news.length === 0) {
      return (
        <div className="no-news">
          <FaInfoCircle />
          <p>Новостей пока нет</p>
        </div>
      );
    }

    return (
      <div className="news-list">
        {news.map(item => (
          <div
            key={item.id}
            className={`news-item ${selectedNews && selectedNews.id === item.id ? 'active' : ''}`}
            onClick={() => handleNewsClick(item.id)}
          >
            <h3>{item.title}</h3>
            {item.subtitle && <p className="news-subtitle">{item.subtitle}</p>}
            <div className="news-meta">
              <span className="news-date">
                {formatDate(item.created_at)}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="content-header">
        <h1>Главное</h1>
      </div>

      <div className="dashboard">
        {/* VIP подписка */}
        <div className="section-box subscription-box">
          <div className="section-header">
            <h2><FaCrown /> VIP подписка</h2>
          </div>

          <div className="vip-plans-list">
            {/* Основной план (всегда видимый) */}
            <div className="vip-plan">
              <div className="vip-plan-info">
                <h3>VIP на {plans[0].name}</h3>
                <p>{plans[0].description}</p>
              </div>
              <div className="vip-plan-price">{plans[0].price} ₽</div>
              <button
                className="buy-vip-btn"
                onClick={() => handleBuyVIP(plans[0])}
              >
                Купить VIP
              </button>
            </div>

            {/* Кнопка "Показать другие планы" */}
            <button
              className="toggle-plans-btn"
              onClick={() => setShowMorePlans(!showMorePlans)}
            >
              {showMorePlans ? (
                <>
                  <span>Скрыть другие планы</span>
                  <FaChevronUp />
                </>
              ) : (
                <>
                  <span>Показать другие планы</span>
                  <FaChevronDown />
                </>
              )}
            </button>

            {/* Дополнительные планы (скрываемые) */}
            <div className={`additional-plans ${showMorePlans ? 'show' : ''}`}>
              {plans.slice(1).map((plan) => (
                <div className="vip-plan" key={plan.id}>
                  <div className="vip-plan-info">
                    <h3>VIP на {plan.name}</h3>
                    <p>{plan.description}</p>
                  </div>
                  <div className="vip-plan-price">{plan.price} ₽</div>
                  <button
                    className="buy-vip-btn"
                    onClick={() => handleBuyVIP(plan)}
                  >
                    Купить VIP
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Новости и обновления */}
        <div className="section-box news-box">
          <div className="section-header">
            <h2><FaNewspaper /> Новости и обновления</h2>
          </div>
          <div className="news-items">
            {renderNews()}
          </div>
        </div>
      </div>

      {/* Модальное окно с детальной информацией о новости */}
      {selectedNews && ReactDOM.createPortal(
        <div
          className="news-detail-overlay"
          onClick={(e) => {
            // Закрываем только при клике на оверлей, а не на его дочерние элементы
            if (e.target.classList.contains('news-detail-overlay')) {
              closeNewsDetail();
            }
          }}
        >
          <div className="news-detail">
            <button className="close-button" onClick={closeNewsDetail} title="Закрыть">
              <FaTimes />
            </button>

            <div className="detail-header">
              <h2 className="detail-title">{selectedNews.title}</h2>
              {selectedNews.subtitle && (
                <p className="detail-subtitle">{selectedNews.subtitle}</p>
              )}

              <div className="detail-meta">
                <span className="detail-date">
                  <FaCalendarAlt /> {formatDate(selectedNews.created_at)}
                </span>
              </div>
            </div>

            <div className="detail-body">
              {selectedNews.content && (
                <div className="detail-content">
                  <div dangerouslySetInnerHTML={{ __html: selectedNews.content.replace(/\n/g, '<br>') }} />
                </div>
              )}

              {(selectedNews.image_url || selectedNews.video_url) && (
                <div className="detail-media">
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
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Модальное окно оплаты */}
      {showPaymentModal && selectedPlan && (
        <PaymentModal
          plan={selectedPlan}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
};

export default HomePage;
