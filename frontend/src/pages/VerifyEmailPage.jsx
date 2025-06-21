import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../api/config';
import './PlaceholderPage.css';

const VerifyEmailPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    } else {
      setError('Токен верификации не найден');
      setLoading(false);
    }
  }, [token]);

  const verifyEmail = async (verificationToken) => {
    try {
      const response = await axios.get(`${API_URL}/auth/verify-email/${verificationToken}`);
      setSuccess(true);
      setError(null);
      
      // Через 3 секунды перенаправляем на страницу входа
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      console.error('Email verification error:', error);
      const errorMessage = error.response?.data?.error || 'Ошибка при подтверждении email';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="placeholder-page">
      <div className="placeholder-container">
        <div className="login-logo">
          <div className="logo">
            <span>FL</span>
            <div className="hub">hub</div>
          </div>
        </div>

        <div className="placeholder-content">
          {loading && (
            <div className="verification-loading">
              <div className="spinner"></div>
              <h2>Подтверждение email...</h2>
              <p>Пожалуйста, подождите</p>
            </div>
          )}

          {success && (
            <div className="verification-success">
              <div className="success-icon">✓</div>
              <h2>Email успешно подтвержден!</h2>
              <p>Ваш email адрес был успешно подтвержден. Теперь вы можете войти в систему.</p>
              <p className="redirect-info">Через несколько секунд вы будете перенаправлены на страницу входа...</p>
              <button 
                className="login-button"
                onClick={() => navigate('/login')}
              >
                Перейти к входу
              </button>
            </div>
          )}

          {error && (
            <div className="verification-error">
              <div className="error-icon">✗</div>
              <h2>Ошибка подтверждения</h2>
              <p>{error}</p>
              <button 
                className="login-button"
                onClick={() => navigate('/login')}
              >
                Вернуться к входу
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage; 