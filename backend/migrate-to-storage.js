/**
 * This script migrates existing files from local storage to Yandex Object Storage
 * and updates the database with the new file URLs.
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const { uploadFile } = require('./services/storageService');
require('dotenv').config();

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || '158.160.178.28',
  database: process.env.DB_NAME || 'flhub',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

// Paths to check for files
const paths = [
  { dir: path.join(__dirname, 'uploads'), dbTable: 'content', dbColumn: 'file_path', storageFolder: 'content' },
  { dir: path.join(__dirname, 'uploads/news'), dbTable: 'news', dbColumn: 'media_url', storageFolder: 'news' },
  { dir: path.join(__dirname, 'uploads/examples'), dbTable: 'content_examples', dbColumn: 'file_path', storageFolder: 'examples' },
  { dir: path.join(__dirname, 'uploads'), dbTable: 'users', dbColumn: 'photo_url', storageFolder: 'avatars', filePrefix: 'avatar' }
];

// Function to get all files in a directory
async function getFiles(dir) {
  let files = [];
  try {
    const items = await readdir(dir);
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stats = await stat(itemPath);
      if (stats.isDirectory()) {
        const subFiles = await getFiles(itemPath);
        files = [...files, ...subFiles];
      } else {
        files.push(itemPath);
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${dir}:`, err);
  }
  return files;
}

// Function to update database with new file path
async function updateDatabase(table, column, id, newPath) {
  try {
    const result = await pool.query(
      `UPDATE ${table} SET ${column} = $1 WHERE id = $2 RETURNING *`,
      [newPath, id]
    );
    return result.rows[0];
  } catch (err) {
    console.error(`Error updating ${table} with ID ${id}:`, err);
    return null;
  }
}

// Function to find records in database that reference a file
async function findRecordsForFile(table, column, filePath) {
  try {
    // Search by exact path and also with '/api/' prefix which might be in the database
    const result = await pool.query(
      `SELECT * FROM ${table} WHERE ${column} LIKE $1 OR ${column} LIKE $2`,
      [`%${filePath}%`, `%/api${filePath}%`]
    );
    return result.rows;
  } catch (err) {
    console.error(`Error finding records in ${table} for file ${filePath}:`, err);
    return [];
  }
}

// Main migration function
async function migrateFiles() {
  let totalFiles = 0;
  let migratedFiles = 0;

  try {
    for (const { dir, dbTable, dbColumn, storageFolder, filePrefix } of paths) {
      console.log(`\nProcessing directory: ${dir}`);
      
      // Check if directory exists
      if (!fs.existsSync(dir)) {
        console.log(`Directory ${dir} does not exist, skipping...`);
        continue;
      }

      // Get all files in the directory
      const files = await getFiles(dir);
      totalFiles += files.length;
      
      console.log(`Found ${files.length} files in ${dir}`);

      for (const file of files) {
        // Skip files that don't match prefix if provided
        const fileName = path.basename(file);
        if (filePrefix && !fileName.startsWith(filePrefix)) {
          console.log(`Skipping ${fileName} as it doesn't match prefix ${filePrefix}`);
          continue;
        }

        // Create a file object similar to what multer would provide
        const fileObject = {
          path: file,
          mimetype: fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') ? 'image/jpeg' :
                    fileName.endsWith('.png') ? 'image/png' :
                    fileName.endsWith('.gif') ? 'image/gif' :
                    fileName.endsWith('.mp4') ? 'video/mp4' :
                    fileName.endsWith('.webm') ? 'video/webm' :
                    'application/octet-stream',
          size: fs.statSync(file).size
        };

        try {
          // Upload file to Yandex Object Storage
          console.log(`Uploading ${fileName} to ${storageFolder}/...`);
          const result = await uploadFile(fileObject, storageFolder);
          
          // Find database records that reference this file
          const relativePath = file.replace(__dirname, '').replace(/\\/g, '/');
          const records = await findRecordsForFile(dbTable, dbColumn, relativePath);
          
          if (records.length > 0) {
            console.log(`Found ${records.length} records in ${dbTable} referencing ${fileName}`);
            
            // Update each record with the new location
            for (const record of records) {
              await updateDatabase(dbTable, dbColumn, record.id, result.location);
              console.log(`Updated ${dbTable} record ID ${record.id} with new path ${result.location}`);
            }
          } else {
            console.log(`No records found in ${dbTable} for file ${fileName}`);
          }
          
          migratedFiles++;
        } catch (err) {
          console.error(`Error processing file ${fileName}:`, err);
        }
      }
    }

    console.log(`\nMigration complete! Migrated ${migratedFiles} out of ${totalFiles} files.`);
  } catch (err) {
    console.error('An error occurred during migration:', err);
  } finally {
    // Close database connection
    await pool.end();
  }
}

// Start the migration
migrateFiles().catch(console.error); 