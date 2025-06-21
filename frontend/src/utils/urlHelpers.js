import { API_HOST, getStorageUrl } from '../config';

export const resolveFileUrl = (url, API_URL) => {
  if (!url) return '';
  
  // If it's already a full URL, return it as is
  if (url.startsWith('http')) return url;
  
  // Handle paths that start with /uploads
  if (url.startsWith('/uploads') || url.replace(/^\/+/, '').startsWith('uploads')) {
    return getStorageUrl(url);
  }
  
  // Handle paths that start with /api/uploads
  if (url.startsWith('/api/uploads') || url.replace(/^\/+/, '').startsWith('api/uploads')) {
    return getStorageUrl(url.replace(/^\/api\//, ''));
  }
  
  // For other relative paths
  return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}; 