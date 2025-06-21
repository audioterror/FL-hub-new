# Yandex Object Storage Integration

## Overview

This application now uses Yandex Object Storage for all media files. Instead of storing files locally on the server, they are uploaded to cloud storage and only the URLs are saved in the database.

## Credentials

The following credentials are used to access Yandex Object Storage:

```
Access Key ID:     YOUR_YANDEX_ACCESS_KEY_ID
Secret Access Key: YOUR_YANDEX_SECRET_ACCESS_KEY
Bucket Name:       your-bucket-name
Region:            ru-central1
Endpoint URL:      https://storage.yandexcloud.net
```

## Configuration

These credentials are configured in the `services/storageService.js` file. For better security, you should set them as environment variables:

1. Create a `.env` file in the backend directory
2. Add the following lines:

```
YANDEX_ACCESS_KEY_ID=YOUR_YANDEX_ACCESS_KEY_ID
YANDEX_SECRET_ACCESS_KEY=YOUR_YANDEX_SECRET_ACCESS_KEY
YANDEX_BUCKET_NAME=your-bucket-name
YANDEX_REGION=ru-central1
YANDEX_ENDPOINT=https://storage.yandexcloud.net
```

## Migration

To migrate existing files from local storage to Yandex Object Storage, run:

```
npm run migrate-storage
```

This will:
1. Scan all local files in the `uploads` directory
2. Upload them to Yandex Object Storage
3. Update the database with the new URLs
4. Keep the local files (they are not deleted automatically)

## Changes Made

The following route files have been updated to use Yandex Object Storage:

- `routes/users.js`: Avatar uploads
- `routes/content.js`: Content file uploads
- `routes/contentExamples.js`: Example file uploads
- `routes/news.js`: News media uploads

All file upload routes now:
1. Temporarily save uploaded files to the local filesystem
2. Upload the file to Yandex Object Storage
3. Delete the local file after successful upload
4. Store only the URL in the database

## Storage Organization

Files are organized in the following structure:

- `avatars/`: User profile photos
- `content/`: Main content files
- `examples/`: Content example files
- `news/`: News media files

## Troubleshooting

If you encounter any issues with file uploads:

1. Check the server logs for error messages
2. Verify that the Yandex Object Storage credentials are correct
3. Make sure the bucket exists and is properly configured with public read access
4. Check network connectivity to the Yandex Object Storage endpoint

## Reverting to Local Storage (Not Recommended)

To revert to local storage, you would need to:

1. Modify the route files to use local storage paths instead of calling the storage service
2. Restore the static file serving middleware in `server.js`
3. Download all files from Yandex Object Storage back to the local filesystem
4. Update the database with local file paths 