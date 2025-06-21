import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../api/config';

// Создаем контекст для аутентификации
const AuthContext = createContext();

// Провайдер контекста аутентификации
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Функция для проверки токена
  const verifyToken = async (token) => {
    try {
      const response = await axios.get(`${API_URL}/auth/verify-token`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.user;
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  };

  // Функция для загрузки пользователя при инициализации
  const loadUser = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      
      if (token) {
        const userData = await verifyToken(token);
        
        if (userData) {
          setUser({ ...userData, token });
        } else {
          // Токен недействителен, очищаем данные
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
      setError('Ошибка при загрузке данных пользователя');
    } finally {
      setLoading(false);
    }
  };

  // При загрузке приложения проверяем токен
  useEffect(() => {
    loadUser();
  }, []);

  // Периодически обновляем данные пользователя (каждые 5 минут)
  useEffect(() => {
    if (user && user.token) {
      const intervalId = setInterval(async () => {
        console.log('Updating user data...');
        const userData = await verifyToken(user.token);
        
        if (userData) {
          setUser({ ...userData, token: user.token });
        } else {
          // Токен истек, выходим из системы
          logout();
        }
      }, 5 * 60 * 1000); // 5 минут

      return () => clearInterval(intervalId);
    }
  }, [user]);

  // Функция для входа пользователя
  const login = (userData) => {
    console.log('Login called with userData:', userData);
    
    setUser(userData);
    setError(null);
    
    // Сохраняем данные в localStorage
    if (userData.token) {
      localStorage.setItem('authToken', userData.token);
    }
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // Функция для выхода пользователя
  const logout = () => {
    setUser(null);
    setError(null);
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    
    // Перенаправляем на страницу входа
    window.location.href = '/login';
  };

  // Значение контекста
  const value = {
    user,
    loading,
    error,
    login,
    logout,
    loadUser,
    isAuthenticated: !!user,
    
    // Функции для проверки ролей
    isAdmin: user && ['ADMIN', 'CEO'].includes(user.role),
    isCEO: user && user.role === 'CEO',
    isVIP: user && ['VIP', 'ADMIN', 'CEO'].includes(user.role),
    
    // Функция для получения заголовков авторизации
    getAuthHeaders: () => {
      const token = user?.token || localStorage.getItem('authToken');
      return token ? { Authorization: `Bearer ${token}` } : {};
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Хук для использования контекста аутентификации
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
