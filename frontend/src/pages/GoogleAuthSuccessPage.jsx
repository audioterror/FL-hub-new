import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './PlaceholderPage.css';

const GoogleAuthSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      // Сохраняем токен и перенаправляем на главную страницу
      const userData = { token };
      login(userData);
      navigate('/');
    } else {
      // Если токен не найден, перенаправляем на страницу входа с ошибкой
      navigate('/login?error=auth_failed');
    }
  }, [searchParams, login, navigate]);

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
          <div className="verification-loading">
            <div className="spinner"></div>
            <h2>Завершение авторизации...</h2>
            <p>Пожалуйста, подождите</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleAuthSuccessPage; 