import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../api/config';
import './PlaceholderPage.css';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (!token) {
      setError('Токен сброса пароля не найден');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.newPassword || !formData.confirmPassword) {
      setError('Заполните все поля');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(`${API_URL}/auth/reset-password`, {
        token: token,
        newPassword: formData.newPassword
      });

      setSuccess(true);
      
      // Через 3 секунды перенаправляем на страницу входа
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      console.error('Password reset error:', error);
      const errorMessage = error.response?.data?.error || 'Ошибка при сбросе пароля';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (!token) {
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
            <div className="verification-error">
              <div className="error-icon">✗</div>
              <h2>Ошибка</h2>
              <p>Токен сброса пароля не найден</p>
              <button 
                className="login-button"
                onClick={() => navigate('/login')}
              >
                Вернуться к входу
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
          {success ? (
            <div className="verification-success">
              <div className="success-icon">✓</div>
              <h2>Пароль успешно изменен!</h2>
              <p>Ваш пароль был успешно изменен. Теперь вы можете войти в систему с новым паролем.</p>
              <p className="redirect-info">Через несколько секунд вы будете перенаправлены на страницу входа...</p>
              <button 
                className="login-button"
                onClick={() => navigate('/login')}
              >
                Перейти к входу
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form">
              <h2>Сброс пароля</h2>
              <p>Введите новый пароль для вашего аккаунта.</p>

              {error && <div className="login-error">{error}</div>}

              <div className="form-group">
                <label htmlFor="newPassword">Новый пароль</label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  placeholder="Минимум 6 символов"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Подтвердите пароль</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Повторите новый пароль"
                  required
                />
              </div>

              <button type="submit" className="login-button" disabled={loading}>
                {loading ? 'Изменение пароля...' : 'Изменить пароль'}
              </button>

              <button 
                type="button"
                className="login-button secondary"
                onClick={() => navigate('/login')}
                disabled={loading}
              >
                Вернуться к входу
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage; 