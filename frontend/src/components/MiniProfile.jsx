import React from 'react';
import './MiniProfile.css';

const MiniProfile = ({ user, onLogout }) => {
  // Получаем первую букву имени для аватара
  const getInitial = () => {
    if (user.first_name && user.first_name.length > 0) {
      return user.first_name.charAt(0).toUpperCase();
    }
    return 'U';
  };

  // Получаем цвет аватара на основе telegram_id
  const getAvatarColor = () => {
    if (!user.telegram_id) return '#ff9800';

    // Используем telegram_id для генерации цвета
    const hue = (user.telegram_id % 360);
    return `hsl(${hue}, 70%, 50%)`;
  };

  // Получаем URL аватара
  const getAvatarUrl = () => {
    // Если есть прямая ссылка на аватарку из API
    if (user.photo_url) {
      return user.photo_url;
    }

    // Если нет аватарки, но есть username, используем сервис для генерации аватарки
    if (user.telegram_username) {
      // Используем сервис UI Avatars для генерации аватарки на основе имени
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.first_name)}&background=${getAvatarColor().replace('#', '')}&color=fff&size=200&bold=true`;
    }

    return null;
  };

  // Форматируем имя пользователя для отображения
  const formatDisplayName = () => {
    // Приоритет отдаем first_name (отображаемое имя)
    if (user.first_name) {
      return user.first_name;
    }

    // Если first_name не задано, используем telegram_username
    if (user.telegram_username) {
      return user.telegram_username;
    }

    return 'Пользователь';
  };

  // Обработчик выхода из аккаунта
  const handleLogout = () => {
    if (window.confirm('Вы действительно хотите выйти из аккаунта?')) {
      onLogout();
    }
  };

  return (
    <div className="mini-profile-container">
      <div className="mini-profile">
        <div
          className="mini-profile-avatar"
          style={{ backgroundColor: getAvatarColor() }}
        >
          {getAvatarUrl() ? (
            <img
              src={getAvatarUrl()}
              alt={user.first_name}
              onError={(e) => {
                // Если изображение не загрузилось, показываем инициалы
                e.target.style.display = 'none';
                e.target.parentNode.querySelector('span').style.display = 'block';
              }}
            />
          ) : null}
          <span style={{ display: getAvatarUrl() ? 'none' : 'block' }}>{getInitial()}</span>
        </div>
        <div className="mini-profile-info">
          <div className="mini-profile-name">{formatDisplayName()}</div>
          <div className="mini-profile-role">{user.role}</div>
        </div>
        <div className="mini-profile-logout" onClick={handleLogout} title="Выйти из аккаунта">
          <i className="fas fa-sign-out-alt"></i>
        </div>
      </div>
    </div>
  );
};

export default MiniProfile;
