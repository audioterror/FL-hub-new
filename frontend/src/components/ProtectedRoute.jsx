import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Компонент для защиты маршрутов, требующих определенной роли пользователя
 * @param {Object} props - Свойства компонента
 * @param {React.ReactNode} props.children - Дочерние элементы (защищенный компонент)
 * @param {Object} props.user - Объект пользователя
 * @param {Array} props.allowedRoles - Массив разрешенных ролей
 * @param {string} props.redirectTo - Путь для перенаправления при отсутствии доступа
 * @returns {React.ReactNode} - Защищенный компонент или перенаправление
 */
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Показываем загрузочный экран пока проверяем авторизацию
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Проверка авторизации...</p>
      </div>
    );
  }

  // Если пользователь не авторизован, перенаправляем на страницу входа
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Если пользователь авторизован, показываем защищенный контент
  return children;
};

export default ProtectedRoute;
