import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_URL, handleApiError } from '../api/config';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

// Настройка Axios для отладки
axios.interceptors.request.use(request => {
  console.log('Starting Request', {
    url: request.url,
    method: request.method,
    data: request.data,
    headers: request.headers
  });
  return request;
});

axios.interceptors.response.use(
  response => {
    console.log('Response:', {
      status: response.status,
      data: response.data,
      headers: response.headers
    });
    return response;
  },
  error => {
    console.error('Response Error:', {
      message: error.message,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : 'No response'
    });
    return Promise.reject(error);
  }
);

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Если пользователь уже авторизован, перенаправляем на главную
  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);
  
  // Данные для входа
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  // Данные для регистрации
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });

  // Данные для сброса пароля
  const [forgotPasswordData, setForgotPasswordData] = useState({
    email: ''
  });

  // Проверяем URL параметры при загрузке (для Google OAuth callback)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const authError = urlParams.get('error');

    if (token) {
      // Получаем данные пользователя по токену
      handleGoogleAuthSuccess(token);
    } else if (authError) {
      setError('Ошибка авторизации через Google');
    }
  }, []);

  // Обработка успешной Google авторизации
  const handleGoogleAuthSuccess = async (token) => {
    try {
      setLoading(true);
      
      // Проверяем токен и получаем данные пользователя
      const response = await axios.get(`${API_URL}/auth/verify-token`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const userData = {
        ...response.data.user,
        token: token
      };

      login(userData);
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Error verifying Google auth token:', error);
      setError('Ошибка при обработке авторизации через Google');
    } finally {
      setLoading(false);
    }
  };

  // Обработка входа
  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!loginData.email || !loginData.password) {
      setError('Заполните все поля');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(`${API_URL}/auth/login`, loginData);
      
      if (response.data.user && response.data.user.token) {
        login(response.data.user);
        const from = location.state?.from?.pathname || '/';
        navigate(from, { replace: true });
      } else {
        setError('Ошибка при получении данных пользователя');
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.error || 'Ошибка при входе в систему';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Обработка регистрации
  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!registerData.email || !registerData.password || !registerData.firstName) {
      setError('Заполните все обязательные поля');
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (registerData.password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(`${API_URL}/auth/register`, {
        email: registerData.email,
        password: registerData.password,
        firstName: registerData.firstName,
        lastName: registerData.lastName
      });

      setSuccess(response.data.message);
      setActiveTab('login');
      
      // Очищаем форму регистрации
      setRegisterData({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: ''
      });
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.error || 'Ошибка при регистрации';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Обработка сброса пароля
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!forgotPasswordData.email) {
      setError('Введите email адрес');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(`${API_URL}/auth/forgot-password`, forgotPasswordData);
      setSuccess(response.data.message);
      
      // Очищаем форму
      setForgotPasswordData({ email: '' });
    } catch (error) {
      console.error('Forgot password error:', error);
      const errorMessage = error.response?.data?.error || 'Ошибка при отправке запроса';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Обработка авторизации через Google
  const handleGoogleAuth = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-logo">
          <div className="logo">
            <span>FL</span>
            <div className="hub">hub</div>
          </div>
        </div>

        <div className="login-form">
          {/* Табы */}
          <div className="login-tabs">
            <button 
              className={`tab ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('login');
                setError(null);
                setSuccess(null);
              }}
            >
              Вход
            </button>
            <button 
              className={`tab ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('register');
                setError(null);
                setSuccess(null);
              }}
            >
              Регистрация
            </button>
            <button 
              className={`tab ${activeTab === 'forgot' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('forgot');
                setError(null);
                setSuccess(null);
              }}
            >
              Забыли пароль?
            </button>
          </div>

          {/* Сообщения об ошибках и успехе */}
          {error && <div className="login-error">{error}</div>}
          {success && <div className="login-success">{success}</div>}

          {/* Форма входа */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="auth-form">
              <h2>Вход в систему</h2>
              
              <div className="form-group">
                <label htmlFor="login-email">Email</label>
                <input
                  id="login-email"
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                  placeholder="Введите ваш email"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="login-password">Пароль</label>
                <input
                  id="login-password"
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  placeholder="Введите ваш пароль"
                  required
                />
              </div>

              <button type="submit" className="login-button" disabled={loading}>
                {loading ? 'Вход...' : 'Войти'}
              </button>

              <div className="divider">или</div>

              <button 
                type="button" 
                className="google-button" 
                onClick={handleGoogleAuth}
                disabled={loading}
              >
                <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" />
                Войти через Google
              </button>
            </form>
          )}

          {/* Форма регистрации */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="auth-form">
              <h2>Регистрация</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="register-firstName">Имя *</label>
                  <input
                    id="register-firstName"
                    type="text"
                    value={registerData.firstName}
                    onChange={(e) => setRegisterData({...registerData, firstName: e.target.value})}
                    placeholder="Ваше имя"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="register-lastName">Фамилия</label>
                  <input
                    id="register-lastName"
                    type="text"
                    value={registerData.lastName}
                    onChange={(e) => setRegisterData({...registerData, lastName: e.target.value})}
                    placeholder="Ваша фамилия"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="register-email">Email *</label>
                <input
                  id="register-email"
                  type="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                  placeholder="Введите ваш email"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="register-password">Пароль *</label>
                <input
                  id="register-password"
                  type="password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                  placeholder="Минимум 6 символов"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="register-confirmPassword">Подтвердите пароль *</label>
                <input
                  id="register-confirmPassword"
                  type="password"
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                  placeholder="Повторите пароль"
                  required
                />
              </div>

              <button type="submit" className="login-button" disabled={loading}>
                {loading ? 'Регистрация...' : 'Зарегистрироваться'}
              </button>

              <div className="divider">или</div>

              <button 
                type="button" 
                className="google-button" 
                onClick={handleGoogleAuth}
                disabled={loading}
              >
                <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" />
                Регистрация через Google
              </button>
            </form>
          )}

          {/* Форма сброса пароля */}
          {activeTab === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="auth-form">
              <h2>Сброс пароля</h2>
              <p>Введите ваш email адрес, и мы отправим вам инструкции по сбросу пароля.</p>
              
              <div className="form-group">
                <label htmlFor="forgot-email">Email</label>
                <input
                  id="forgot-email"
                  type="email"
                  value={forgotPasswordData.email}
                  onChange={(e) => setForgotPasswordData({...forgotPasswordData, email: e.target.value})}
                  placeholder="Введите ваш email"
                  required
                />
              </div>

              <button type="submit" className="login-button" disabled={loading}>
                {loading ? 'Отправка...' : 'Отправить инструкции'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
