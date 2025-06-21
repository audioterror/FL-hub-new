const isDev = process.env.NODE_ENV !== 'production';

export const API_HOST = isDev
  ? 'http://localhost:5000'                      // dev - локальный backend
  : 'http://158.160.178.28:5000'; // prod

export const apiUrl = (path) =>
  `${API_HOST}${path.startsWith('/') ? path : '/' + path}`;

export const wsUrl = (path) =>
  apiUrl(path).replace(/^http/, 'ws');

// For backward compatibility
export const API_URL = `${API_HOST}/api`;

// Yandex Object Storage configuration
export const STORAGE_CONFIG = {
  BUCKET_NAME: 'flhub-files',
  STORAGE_URL: 'https://flhub-files.storage.yandexcloud.net'
};

// Helper function to resolve storage URLs
export const getStorageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  
  // Remove leading slashes and 'uploads/' if present
  const cleanPath = path.replace(/^\/+/, '').replace(/^uploads\//, '');
  return `${STORAGE_CONFIG.STORAGE_URL}/${cleanPath}`;
};

// Telegram bot token (keep existing value)
export const TELEGRAM_BOT_TOKEN = '7691324824:AAE5yDpAsIDS10gQd3h95Pt_h8K4mEc0BM4';
