import React, { useState } from 'react';
import { FaSpinner, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';
import { updateUserRole, deleteUser } from '../api/users';
import './UserList.css';

/**
 * Компонент для отображения списка пользователей
 * @param {Object} props - Свойства компонента
 * @param {Array} props.users - Список пользователей
 * @param {Function} props.onUserUpdate - Функция обновления пользователя
 * @param {Function} props.onUserDelete - Функция удаления пользователя
 * @param {Object} props.currentUser - Текущий пользователь
 * @returns {React.ReactNode}
 */
const UserList = ({ users, onUserUpdate, onUserDelete, currentUser }) => {
  // Состояние для поиска
  const [searchQuery, setSearchQuery] = useState('');

  // Состояние для загрузки
  const [loadingStates, setLoadingStates] = useState({});

  // Состояние для ошибок
  const [errors, setErrors] = useState({});

  // Состояние для подтверждения удаления
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Состояние для модального окна выбора срока действия VIP
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(1); // По умолчанию 1 месяц

  // Обработчик изменения роли пользователя
  const handleRoleChange = async (userId, newRole, duration = null) => {
    // Если выбрана роль VIP и не указан срок действия, показываем модальное окно
    if (newRole === 'VIP' && duration === null) {
      setSelectedUserId(userId);
      setSelectedRole(newRole);
      setShowDurationModal(true);
      return;
    }

    // Если выбрана роль ADMIN, устанавливаем срок действия 100 лет (фактически бессрочно)
    if (newRole === 'ADMIN') {
      duration = 1200; // 100 лет в месяцах
    }

    // Устанавливаем состояние загрузки для этого пользователя
    setLoadingStates(prev => ({ ...prev, [userId]: true }));

    // Сбрасываем ошибку для этого пользователя
    setErrors(prev => ({ ...prev, [userId]: null }));

    try {
      // Обновляем роль пользователя
      const updatedUser = await updateUserRole(userId, newRole, duration);

      // Вызываем функцию обновления пользователя
      onUserUpdate(updatedUser);

      // Сбрасываем состояние загрузки для этого пользователя
      setLoadingStates(prev => ({ ...prev, [userId]: false }));
    } catch (error) {
      console.error('Error updating user role:', error);

      // Устанавливаем ошибку для этого пользователя
      setErrors(prev => ({
        ...prev,
        [userId]: error.response?.data?.error || error.message || 'Ошибка при обновлении роли'
      }));

      // Сбрасываем состояние загрузки для этого пользователя
      setLoadingStates(prev => ({ ...prev, [userId]: false }));
    }
  };

  // Обработчик подтверждения выбора срока действия VIP
  const handleDurationConfirm = () => {
    handleRoleChange(selectedUserId, selectedRole, selectedDuration);
    setShowDurationModal(false);
  };

  // Обработчик отмены выбора срока действия VIP
  const handleDurationCancel = () => {
    setShowDurationModal(false);
    // Сбрасываем выбранную роль пользователя в интерфейсе
    const user = users.find(u => u.id === selectedUserId);
    if (user) {
      // Находим элемент select и сбрасываем его значение
      const selectElement = document.querySelector(`select[data-user-id="${selectedUserId}"]`);
      if (selectElement) {
        selectElement.value = user.role_name || 'BASIC';
      }
    }
  };

  // Обработчик удаления пользователя
  const handleDelete = async (userId) => {
    // Если пользователь не подтвердил удаление, запрашиваем подтверждение
    if (deleteConfirm !== userId) {
      setDeleteConfirm(userId);
      return;
    }

    // Сбрасываем подтверждение удаления
    setDeleteConfirm(null);

    // Устанавливаем состояние загрузки для этого пользователя
    setLoadingStates(prev => ({ ...prev, [userId]: true }));

    // Сбрасываем ошибку для этого пользователя
    setErrors(prev => ({ ...prev, [userId]: null }));

    try {
      // Удаляем пользователя
      await deleteUser(userId);

      // Вызываем функцию удаления пользователя
      onUserDelete(userId);
    } catch (error) {
      console.error('Error deleting user:', error);

      // Устанавливаем ошибку для этого пользователя
      setErrors(prev => ({
        ...prev,
        [userId]: error.response?.data?.error || error.message || 'Ошибка при удалении пользователя'
      }));

      // Сбрасываем состояние загрузки для этого пользователя
      setLoadingStates(prev => ({ ...prev, [userId]: false }));
    }
  };

  // Обработчик отмены удаления
  const handleCancelDelete = () => {
    setDeleteConfirm(null);
  };

  // Фильтруем пользователей по поисковому запросу
  const filteredUsers = users.filter(user => {
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim().toLowerCase();
    const username = (user.telegram_username || '').toLowerCase();
    const query = searchQuery.toLowerCase();

    return fullName.includes(query) || username.includes(query);
  });

  // Проверяем, является ли пользователь текущим пользователем
  const isCurrentUser = (user) => {
    return currentUser && user.telegram_id === currentUser.telegram_id;
  };

  return (
    <div className="user-list-container">
      {/* Модальное окно выбора срока действия VIP */}
      {showDurationModal && (
        <div className="duration-modal-backdrop">
          <div className="duration-modal">
            <div className="duration-modal-header">
              <h3>Выберите срок действия VIP</h3>
              <button className="close-button" onClick={handleDurationCancel}>×</button>
            </div>
            <div className="duration-modal-content">
              <p>Укажите, на какой срок выдать VIP-статус пользователю:</p>
              <div className="duration-options">
                <label>
                  <input
                    type="radio"
                    name="duration"
                    value="1"
                    checked={selectedDuration === 1}
                    onChange={() => setSelectedDuration(1)}
                  />
                  <span>1 месяц</span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="duration"
                    value="3"
                    checked={selectedDuration === 3}
                    onChange={() => setSelectedDuration(3)}
                  />
                  <span>3 месяца</span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="duration"
                    value="6"
                    checked={selectedDuration === 6}
                    onChange={() => setSelectedDuration(6)}
                  />
                  <span>6 месяцев</span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="duration"
                    value="12"
                    checked={selectedDuration === 12}
                    onChange={() => setSelectedDuration(12)}
                  />
                  <span>12 месяцев</span>
                </label>
              </div>
            </div>
            <div className="duration-modal-footer">
              <button className="cancel-button" onClick={handleDurationCancel}>Отмена</button>
              <button className="confirm-button" onClick={handleDurationConfirm}>Подтвердить</button>
            </div>
          </div>
        </div>
      )}

      <div className="user-list-search">
        <input
          type="text"
          placeholder="Поиск пользователей..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="user-list-table-container">
        <table className="user-list-table">
          <thead>
            <tr>
              <th>Имя</th>
              <th>Username</th>
              <th>Роль</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="4" className="no-users">
                  {searchQuery ? 'Пользователи не найдены' : 'Нет пользователей'}
                </td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user.id} className={isCurrentUser(user) ? 'current-user' : ''}>
                  <td>
                    {`${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Без имени'}
                    {isCurrentUser(user) && <span className="current-user-badge">Вы</span>}
                  </td>
                  <td>{user.telegram_username ? `@${user.telegram_username}` : 'Нет username'}</td>
                  <td>
                    <select
                      value={user.role_name || 'BASIC'}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      disabled={
                        user.role_name === 'CEO' ||
                        isCurrentUser(user) ||
                        loadingStates[user.id]
                      }
                      className={errors[user.id] ? 'error' : ''}
                      data-user-id={user.id}
                    >
                      <option value="BASIC">BASIC</option>
                      <option value="VIP">VIP</option>
                      <option value="ADMIN">ADMIN</option>
                      {user.role_name === 'CEO' && <option value="CEO">CEO</option>}
                    </select>
                    {user.vip_expires_at && user.role_name === 'VIP' && (
                      <div className="vip-expiry">
                        VIP до: {new Date(user.vip_expires_at).toLocaleDateString()}
                      </div>
                    )}
                    {loadingStates[user.id] && <FaSpinner className="spinner" />}
                    {errors[user.id] && (
                      <div className="error-tooltip">
                        {errors[user.id]}
                      </div>
                    )}
                  </td>
                  <td>
                    {!isCurrentUser(user) && user.role_name !== 'CEO' && (
                      deleteConfirm === user.id ? (
                        <div className="delete-confirm">
                          <button
                            className="confirm-yes"
                            onClick={() => handleDelete(user.id)}
                            disabled={loadingStates[user.id]}
                          >
                            {loadingStates[user.id] ? <FaSpinner className="spinner" /> : <FaCheck />}
                          </button>
                          <button
                            className="confirm-no"
                            onClick={handleCancelDelete}
                            disabled={loadingStates[user.id]}
                          >
                            <FaTimes />
                          </button>
                        </div>
                      ) : (
                        <button
                          className="delete-button"
                          onClick={() => handleDelete(user.id)}
                          disabled={loadingStates[user.id]}
                        >
                          <FaTrash />
                        </button>
                      )
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserList;
