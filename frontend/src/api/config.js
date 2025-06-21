import { API_URL as BaseApiUrl, API_HOST } from '../config';

// Конфигурация API
export const API_URL = BaseApiUrl;
export const BOT_USERNAME = 'FLhuboff_bot';

// Функция для получения заголовков авторизации
export const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

// Функция для проверки ответа API
export const handleApiError = (error) => {
  console.error('API Error:', error);
  
  if (error.response) {
    // Ошибка от сервера с ответом
    console.error('Response data:', error.response.data);
    console.error('Response status:', error.response.status);
    
    return {
      message: error.response.data.error || 'Произошла ошибка при обращении к серверу',
      status: error.response.status
    };
  } else if (error.request) {
    // Запрос был сделан, но ответ не получен
    console.error('No response received:', error.request);
    return {
      message: 'Сервер не отвечает. Пожалуйста, проверьте подключение к интернету.',
      status: 0
    };
  } else {
    // Что-то пошло не так при настройке запроса
    console.error('Request error:', error.message);
    return {
      message: 'Ошибка при отправке запроса: ' + error.message,
      status: 0
    };
  }
};
