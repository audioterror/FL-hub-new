import React, { useState, useEffect } from 'react';
import { FaSync, FaSpinner, FaTimes, FaNewspaper } from 'react-icons/fa';
import axios from 'axios';
import { getUsersList, getUsersStats } from '../api/users';
import StatsCards from '../components/StatsCards';
import UserList from '../components/UserList';
import NewsManager from '../components/NewsManager';
import { API_URL } from '../api/config';
import './CEOPanelPage.css';

/**
 * Страница панели CEO
 * @returns {React.ReactNode}
 */
const CEOPanelPage = () => {
  // Состояние для списка пользователей
  const [users, setUsers] = useState([]);

  // Состояние для количества контента
  const [contentCount, setContentCount] = useState(0);

  // Состояние для загрузки
  const [loading, setLoading] = useState(true);

  // Состояние для ошибки
  const [error, setError] = useState(null);

  // Состояние для обновления
  const [refreshing, setRefreshing] = useState(false);

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    fetchData();

    // Получаем количество контента из localStorage
    const contentCountFromStorage = localStorage.getItem('contentCount');
    if (contentCountFromStorage) {
      setContentCount(parseInt(contentCountFromStorage));
    }
  }, []);

  // Функция для загрузки данных
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Получаем список пользователей
      const usersList = await getUsersList();
      setUsers(usersList);

      // Получаем количество контента
      try {
        // Получаем токен из localStorage
        const authToken = localStorage.getItem('authToken');
        if (authToken) {
          const response = await axios.get(`${API_URL}/content/count`, {
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          });

          // Обновляем состояние и localStorage
          const count = response.data.count;
          setContentCount(count);
          localStorage.setItem('contentCount', count.toString());
          console.log('Content count updated:', count);
        }
      } catch (contentError) {
        console.error('Error fetching content count:', contentError);
        // Не устанавливаем ошибку, чтобы не блокировать отображение статистики пользователей
      }

      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.response?.data?.error || error.message || 'Ошибка при загрузке данных');
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Обработчик обновления данных
  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Обработчик обновления пользователя
  const handleUserUpdate = (updatedUser) => {
    // Обновляем пользователя в списке
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === updatedUser.id ? { ...user, ...updatedUser } : user
      )
    );
  };

  // Обработчик удаления пользователя
  const handleUserDelete = (userId) => {
    // Удаляем пользователя из списка
    setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
  };

  // Получаем статистику пользователей
  const usersStats = getUsersStats(users);

  // Получаем текущего пользователя из localStorage
  const getCurrentUser = () => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        return null;
      }
    }
    return null;
  };

  const currentUser = getCurrentUser();

  return (
    <div className="ceo-panel-page">
      <div className="content-header">
        <h1>Панель управления</h1>
        <button
          className={`refresh-button ${refreshing ? 'refreshing' : ''}`}
          onClick={handleRefresh}
          disabled={loading || refreshing}
        >
          {refreshing ? <FaSpinner className="spinner" /> : <FaSync />}
          <span>{refreshing ? 'Обновление...' : 'Обновить'}</span>
        </button>
      </div>

      {/* Статистика */}
      <div className="section-box">
        <div className="section-header">
          <h2>Статистика</h2>
        </div>
        <div className="section-content">
          {loading && !refreshing ? (
            <div className="loading-indicator">
              <FaSpinner className="spinner" />
              <span>Загрузка статистики...</span>
            </div>
          ) : error ? (
            <div className="error-container">
              <div className="error-message">
                <FaTimes />
                <span>{error}</span>
              </div>
              <button
                className="retry-button"
                onClick={fetchData}
                disabled={loading}
              >
                {loading ? <FaSpinner className="spinner" /> : 'Повторить попытку'}
              </button>
            </div>
          ) : (
            <StatsCards usersStats={usersStats} contentCount={contentCount} />
          )}
        </div>
      </div>

      {/* Управление новостями */}
      <div className="section-box">
        <div className="section-header">
          <h2><FaNewspaper /> Управление новостями</h2>
        </div>
        <div className="section-content">
          <NewsManager />
        </div>
      </div>

      {/* Список пользователей */}
      <div className="section-box">
        <div className="section-header">
          <h2>Пользователи</h2>
        </div>
        <div className="section-content">
          {loading && !refreshing ? (
            <div className="loading-indicator">
              <FaSpinner className="spinner" />
              <span>Загрузка пользователей...</span>
            </div>
          ) : error ? (
            <div className="error-container">
              <div className="error-message">
                <FaTimes />
                <span>{error}</span>
              </div>
              <button
                className="retry-button"
                onClick={fetchData}
                disabled={loading}
              >
                {loading ? <FaSpinner className="spinner" /> : 'Повторить попытку'}
              </button>
            </div>
          ) : (
            <UserList
              users={users}
              onUserUpdate={handleUserUpdate}
              onUserDelete={handleUserDelete}
              currentUser={currentUser}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CEOPanelPage;
