import React, { useState, useEffect } from 'react';
import { FaTimes, FaCopy, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { API_URL, getAuthHeaders, handleApiError } from '../api/config';
import axios from 'axios';
import './PaymentModal.css';

const PaymentModal = ({ plan, onClose }) => {
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState({
    cardNumber: false,
    comment: false
  });

  // Получаем информацию о платеже при монтировании компонента
  useEffect(() => {
    const fetchPaymentInfo = async () => {
      try {
        // Получаем токен из localStorage
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('user');

        console.log('Auth token from localStorage:', token ? `${token.substring(0, 15)}...` : 'No token');
        console.log('User data from localStorage:', userData ? 'Exists' : 'No user data');

        if (!token) {
          setError('Для оплаты необходимо авторизоваться');
          setLoading(false);
          return;
        }

        // Проверяем, что токен имеет формат JWT
        if (!token.includes('.')) {
          setError('Некорректный формат токена авторизации');
          setLoading(false);
          return;
        }

        console.log('Sending payment request to:', `${API_URL}/subscription/payment-request`);
        console.log('Plan ID:', plan.id);
        console.log('Headers:', getAuthHeaders());

        // Отправляем запрос на сервер
        const response = await axios.post(
          `${API_URL}/subscription/payment-request`,
          { plan_id: plan.id },
          { headers: getAuthHeaders() }
        );

        console.log('Payment request response:', response.data);

        setPaymentInfo(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching payment info:', error);

        const errorInfo = handleApiError(error);
        setError(errorInfo.message || 'Произошла ошибка при получении информации о платеже');
        setLoading(false);
      }
    };

    fetchPaymentInfo();
  }, [plan.id]);

  // Функция для копирования текста в буфер обмена
  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text).then(() => {
      // Устанавливаем состояние скопированного поля
      setCopied(prev => ({ ...prev, [field]: true }));

      // Сбрасываем состояние через 2 секунды
      setTimeout(() => {
        setCopied(prev => ({ ...prev, [field]: false }));
      }, 2000);
    });
  };

  return (
    <div className="payment-modal-backdrop">
      <div className="payment-modal">
        <div className="payment-modal-header">
          <h2>Оплата подписки</h2>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="payment-modal-content">
          {loading ? (
            <div className="payment-loading">
              <div className="spinner"></div>
              <p>Загрузка информации о платеже...</p>
            </div>
          ) : error ? (
            <div className="payment-error">
              <FaExclamationTriangle />
              <p>{error}</p>
              <button className="btn-primary" onClick={onClose}>Закрыть</button>
            </div>
          ) : (
            <>
              <div className="payment-info-section">
                <h3>Информация о платеже</h3>
                <div className="payment-info-row">
                  <span className="payment-label">Выбранный план:</span>
                  <span className="payment-value">{plan.name}</span>
                </div>
                <div className="payment-info-row">
                  <span className="payment-label">Сумма к оплате:</span>
                  <span className="payment-value highlight">{plan.price} ₽</span>
                </div>
              </div>

              <div className="payment-details-section">
                <h3>Реквизиты для оплаты</h3>
                <div className="payment-card">
                  <div className="payment-info-row">
                    <span className="payment-label">Номер карты:</span>
                    <div className="payment-value-with-copy">
                      <span className="payment-value">{paymentInfo?.payment_details.card_number}</span>
                      <button
                        className="copy-button"
                        onClick={() => copyToClipboard(paymentInfo?.payment_details.card_number, 'cardNumber')}
                      >
                        {copied.cardNumber ? <FaCheck className="copied" /> : <FaCopy />}
                      </button>
                    </div>
                  </div>
                  <div className="payment-info-row">
                    <span className="payment-label">Банк:</span>
                    <span className="payment-value">{paymentInfo?.payment_details.bank}</span>
                  </div>
                  <div className="payment-info-row">
                    <span className="payment-label">Комментарий к платежу:</span>
                    <div className="payment-value-with-copy">
                      <span className="payment-value">{paymentInfo?.payment_details.comment}</span>
                      <button
                        className="copy-button"
                        onClick={() => copyToClipboard(paymentInfo?.payment_details.comment, 'comment')}
                      >
                        {copied.comment ? <FaCheck className="copied" /> : <FaCopy />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="payment-warning">
                <FaExclamationTriangle />
                <p>Внимание! Платежи без комментария не подлежат возврату.</p>
              </div>

              <div className="payment-instructions">
                <h3>Инструкция</h3>
                <ol>
                  <li>Переведите указанную сумму на карту</li>
                  <li>Обязательно укажите комментарий к платежу</li>
                  <li>После оплаты свяжитесь с администратором в Telegram: <a href="https://t.me/twatsk1" target="_blank" rel="noopener noreferrer">@twatsk1</a></li>
                </ol>
              </div>
            </>
          )}
        </div>

        <div className="payment-modal-footer">
          <button className="btn-secondary" onClick={onClose}>Закрыть</button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
