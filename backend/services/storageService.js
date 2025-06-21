const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Используем переменные окружения для Yandex Storage
const YANDEX_ACCESS_KEY_ID = process.env.YANDEX_CLOUD_KEY_ID;
const YANDEX_SECRET_ACCESS_KEY = process.env.YANDEX_CLOUD_SECRET;
const YANDEX_ENDPOINT = process.env.YANDEX_ENDPOINT || 'https://storage.yandexcloud.net';
const YANDEX_REGION = process.env.YANDEX_REGION || 'ru-central1';
const YANDEX_BUCKET_NAME = process.env.YANDEX_BUCKET_NAME;

// Проверяем наличие всех необходимых переменных
const credsOk = YANDEX_ACCESS_KEY_ID && YANDEX_SECRET_ACCESS_KEY && YANDEX_BUCKET_NAME;

let s3 = null;
let bucketName = YANDEX_BUCKET_NAME;

if (credsOk) {
  // Инициализируем S3 клиент с переменными окружения
  const s3Config = {
    accessKeyId: YANDEX_ACCESS_KEY_ID,
    secretAccessKey: YANDEX_SECRET_ACCESS_KEY,
    endpoint: YANDEX_ENDPOINT,
    region: YANDEX_REGION,
    s3ForcePathStyle: true,
    signatureVersion: 'v4'
  };

  s3 = new AWS.S3(s3Config);
  console.log('Yandex Object Storage enabled');
} else {
  console.warn('Yandex Object Storage credentials not found. Using local storage.');
}

/**
 * Upload a file to Yandex Object Storage
 * @param {Object} file - The file object from multer
 * @param {string} folder - The folder to store the file in (e.g., 'avatars', 'content', 'news')
 * @returns {Promise<{ key: string, location: string }>} - The key and URL of the uploaded file
 */
const uploadFile = async (file, folder = 'uploads') => {
  try {
    const fileStream = fs.createReadStream(file.path);
    const fileName = path.basename(file.path);
    const key = `${folder}/${fileName}`;
    const uploadParams = {
      Bucket: bucketName,
      Key: key,
      Body: fileStream,
      ContentType: file.mimetype,
      ACL: 'public-read'
    };
    const result = await s3.upload(uploadParams).promise();
    fs.unlinkSync(file.path);
    return { key: result.Key, location: result.Location || `https://${bucketName}.storage.yandexcloud.net/${key}` };
  } catch (error) {
    console.error('Error uploading file to Yandex Object Storage:', error);
    
    // Fallback to local storage if upload fails
    const destDir = path.join(__dirname, `../uploads/${folder}`);
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    const fileName = path.basename(file.path);
    const destPath = path.join(destDir, fileName);
    fs.renameSync(file.path, destPath);
    const webPath = `/uploads/${folder}/${fileName}`;
    console.warn('Falling back to local storage due to Yandex Storage error');
    return { key: webPath, location: webPath };
  }
};

/**
 * Delete a file from Yandex Object Storage
 * @param {string} fileKey - The key of the file to delete
 * @returns {Promise<boolean>} - True if deletion was successful
 */
const deleteFile = async (fileKey) => {
  try {
    if (fileKey.startsWith('http')) { 
      const url = new URL(fileKey); 
      fileKey = url.pathname.substring(1); 
    }
    if (fileKey.startsWith(`${bucketName}/`)) {
      fileKey = fileKey.substring(bucketName.length + 1);
    }
    await s3.deleteObject({ Bucket: bucketName, Key: fileKey }).promise();
    return true;
  } catch (error) { 
    console.error(`Error deleting file ${fileKey}:`, error); 
    return false; 
  }
};

/**
 * Get the URL for a file in Yandex Object Storage
 * @param {string} fileKey - The key of the file
 * @returns {string} - The URL of the file
 */
const getFileUrl = (fileKey) => {
  // If fileKey is null or undefined, return empty string
  if (!fileKey) return '';
  
  // If the fileKey is already a full URL, return it
  if (fileKey.startsWith('http')) {
    return fileKey;
  }
  
  // For local storage paths that exist in the database
  if (fileKey.startsWith('/uploads') || fileKey.replace(/^\/+/, '').startsWith('uploads')) {
    // Convert local paths to Yandex Storage paths
    const cleanPath = fileKey.replace(/^\/+uploads\/+/, '');
    return `https://${bucketName}.storage.yandexcloud.net/uploads/${cleanPath}`;
  }

  // If the fileKey starts with the bucket name, remove it
  if (fileKey.startsWith(`${bucketName}/`)) {
    fileKey = fileKey.substring(bucketName.length + 1);
  }

  return `https://${bucketName}.storage.yandexcloud.net/${fileKey}`;
};

/**
 * Get a readable stream for a file from Yandex Object Storage
 * @param {string} fileKey - The key of the file
 * @returns {Promise<{stream: ReadableStream, contentLength: number, contentType: string}>} - The stream and file info
 */
const getFileStream = async (fileKey) => {
  try {
    // If the fileKey is a full URL, extract just the key part
    if (fileKey.startsWith('http')) {
      const url = new URL(fileKey);
      fileKey = url.pathname.substring(1); // Remove leading slash
    }

    // If the fileKey starts with the bucket name, remove it
    if (fileKey.startsWith(`${bucketName}/`)) {
      fileKey = fileKey.substring(bucketName.length + 1);
    }

    // Get file metadata first to get content type and size
    const headParams = {
      Bucket: bucketName,
      Key: fileKey
    };

    const metadata = await s3.headObject(headParams).promise();

    // Create stream for the file
    const getParams = {
      Bucket: bucketName,
      Key: fileKey
    };

    const stream = s3.getObject(getParams).createReadStream();

    return {
      stream,
      contentLength: metadata.ContentLength,
      contentType: metadata.ContentType || 'application/octet-stream'
    };
  } catch (error) {
    console.error(`Error getting file stream for ${fileKey} from Yandex Object Storage:`, error);
    throw error;
  }
};

/**
 * Extract file key from URL or path
 * @param {string} filePathOrUrl - The file path or URL
 * @returns {string} - The file key
 */
const extractFileKey = (filePathOrUrl) => {
  // If the filePathOrUrl is a full URL, extract just the key part
  if (filePathOrUrl.startsWith('http')) {
    const url = new URL(filePathOrUrl);
    return url.pathname.substring(1); // Remove leading slash
  }

  // If the filePathOrUrl starts with the bucket name, remove it
  if (filePathOrUrl.startsWith(`${bucketName}/`)) {
    return filePathOrUrl.substring(bucketName.length + 1);
  }

  return filePathOrUrl;
};

module.exports = {
  uploadFile,
  deleteFile,
  getFileUrl,
  getFileStream,
  extractFileKey,
  s3,
  bucketName
};