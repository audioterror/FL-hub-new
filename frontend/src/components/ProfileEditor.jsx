import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../api/config';
import './ProfileEditor.css';

const ProfileEditor = ({ user, onClose, onSave, onLogout }) => {
  const [displayName, setDisplayName] = useState(user.first_name || '');
  const [status, setStatus] = useState(user.status || '');
  const [telegramUsername, setTelegramUsername] = useState(user.telegram_username || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user.photo_url || null);

  const fileInputRef = useRef(null);

  // Эффект для отображения сообщения об успехе
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Функция для загрузки фото
  const handlePhotoUpload = () => {
    fileInputRef.current.click();
  };

  // Обработчик выбора файла
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Проверяем, что файл - изображение
    if (!file.type.startsWith('image/')) {
      setError('Пожалуйста, выберите изображение');
      return;
    }

    // Проверяем размер файла (не более 5 МБ)
    if (file.size > 5 * 1024 * 1024) {
      setError('Размер файла не должен превышать 5 МБ');
      return;
    }

    setAvatarFile(file);

    // Создаем превью
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target.result);
    };
    reader.readAsDataURL(file);

    setError(null);
  };

  // Функция для сохранения изменений
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      console.log('Saving profile with values:', {
        displayName,
        status,
        telegramUsername,
        hasAvatarFile: !!avatarFile
      });

      // Создаем объект с обновленными данными пользователя
      const updatedUser = {
        ...user,
        first_name: displayName,
        status,
        telegram_username: telegramUsername
      };

      console.log('Initial updatedUser:', updatedUser);

      // Если есть новый файл аватарки, загружаем его
      if (avatarFile) {
        try {
          const formData = new FormData();
          formData.append('avatar', avatarFile);
          formData.append('telegram_id', user.telegram_id);

          console.log('Uploading avatar file:', avatarFile.name, 'size:', avatarFile.size, 'type:', avatarFile.type);

          // Проверяем содержимое FormData
          for (let pair of formData.entries()) {
            console.log(pair[0] + ': ' + (pair[0] === 'avatar' ? 'File object' : pair[1]));
          }

          const uploadResponse = await axios.post(`${API_URL}/users/upload-avatar`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });

          console.log('Upload response:', uploadResponse.data);

          if (uploadResponse.data && uploadResponse.data.photo_url) {
            updatedUser.photo_url = uploadResponse.data.photo_url;
            console.log('Updated photo_url:', updatedUser.photo_url);
          }
        } catch (uploadError) {
          console.error('Error uploading avatar:', uploadError);

          // Выводим полную информацию об ошибке
          if (uploadError.response) {
            console.error('Error response:', uploadError.response.data);
            console.error('Error status:', uploadError.response.status);
            console.error('Error headers:', uploadError.response.headers);
          } else if (uploadError.request) {
            console.error('Error request:', uploadError.request);
          }

          // Получаем более подробное сообщение об ошибке
          let errorMessage = 'Ошибка при загрузке аватарки. Пожалуйста, попробуйте еще раз.';
          if (uploadError.response && uploadError.response.data && uploadError.response.data.error) {
            errorMessage = uploadError.response.data.error;
          } else if (uploadError.message) {
            errorMessage = uploadError.message;
          }

          setError(errorMessage);
          setSaving(false);
          return;
        }
      }

      // Подготавливаем данные для отправки
      const updateData = {
        first_name: displayName,
        telegram_username: telegramUsername,
        status,
        photo_url: updatedUser.photo_url // Добавляем URL фото, если он был обновлен
      };

      console.log('Sending update data to server:', updateData);

      // Обновляем данные пользователя через API
      const response = await axios.patch(
        `${API_URL}/auth/user/${user.telegram_id}`,
        updateData
      );

      console.log('Server response:', response.data);

      // Если обновление прошло успешно, вызываем функцию onSave
      if (response.data) {
        // Обновляем данные пользователя в localStorage
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          console.log('Current user data in localStorage:', userData);

          const finalUpdatedUser = {
            ...userData,
            ...response.data,
            photo_url: updatedUser.photo_url || response.data.photo_url,
            token: userData.token // Сохраняем токен
          };

          console.log('Final updated user data:', finalUpdatedUser);

          // Обновляем localStorage
          localStorage.setItem('user', JSON.stringify(finalUpdatedUser));

          // Вызываем функцию onSave с обновленными данными
          onSave(finalUpdatedUser);
        } else {
          // Если нет данных в localStorage, просто используем ответ от сервера
          const finalUpdatedUser = {
            ...updatedUser,
            ...response.data,
            photo_url: updatedUser.photo_url || response.data.photo_url
          };
          console.log('Final updated user data (no localStorage):', finalUpdatedUser);
          onSave(finalUpdatedUser);
        }

        setSuccessMessage('Профиль успешно обновлен');

        // Закрываем окно редактирования через 1 секунду
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    } catch (error) {
      console.error('Error saving profile:', error);

      // Получаем более подробное сообщение об ошибке, если оно есть
      let errorMessage = 'Ошибка при сохранении профиля. Пожалуйста, попробуйте еще раз.';
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-editor-overlay">
      <div className="profile-editor">
        <div className="profile-editor-header">
          <h2>Настройки профиля</h2>
          <button className="profile-editor-close" onClick={onClose}>×</button>
        </div>

        <div className="profile-editor-content">
          {error && (
            <div className="profile-editor-error">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="profile-editor-success">
              {successMessage}
            </div>
          )}

          <div className="profile-editor-avatar-section">
            <div className="profile-editor-avatar" onClick={handlePhotoUpload}>
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={user.first_name}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className="profile-editor-avatar-placeholder" style={{ display: avatarPreview ? 'none' : 'flex' }}>
                {user.first_name ? user.first_name.charAt(0).toUpperCase() : 'U'}
              </div>
            </div>
            <button className="profile-editor-upload-btn" onClick={handlePhotoUpload}>
              <span className="upload-icon">📷</span> Загрузить фото
            </button>

            {/* Скрытый input для выбора файла */}
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          <div className="profile-editor-form">
            <div className="profile-editor-field">
              <label>Отображаемое имя</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Введите имя"
              />
            </div>

            <div className="profile-editor-field">
              <label>Кастомный статус (до 40 символов)</label>
              <input
                type="text"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                maxLength={40}
                placeholder="Укажите ваш статус"
              />
            </div>



            <div className="profile-editor-field">
              <label>Телеграм для связи</label>
              <input
                type="text"
                value={telegramUsername}
                onChange={(e) => setTelegramUsername(e.target.value)}
                placeholder="username"
              />
            </div>
          </div>

          <div className="profile-editor-divider"></div>

          <div className="profile-editor-account-status">
            <h3>Статус аккаунта</h3>
            <div className="profile-editor-role">
              <span className={`role-badge ${user.role.toLowerCase()}`}>{user.role}</span>
            </div>
          </div>

          <div className="profile-editor-actions">
            <button
              className="profile-editor-logout"
              onClick={onLogout}
              disabled={saving}
            >
              Выйти из аккаунта
            </button>
            <div className="profile-editor-buttons">
              <button
                className="profile-editor-cancel"
                onClick={onClose}
                disabled={saving}
              >
                Отмена
              </button>
              <button
                className="profile-editor-save"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditor;
