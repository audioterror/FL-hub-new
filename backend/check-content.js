const { pool } = require('./config/db');

async function checkContent() {
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    
    console.log('Querying content table...');
    const result = await client.query('SELECT * FROM content ORDER BY created_at DESC');
    
    console.log('Content table data:');
    console.log('Total rows:', result.rows.length);
    
    if (result.rows.length > 0) {
      console.log('\nContent items:');
      result.rows.forEach((row, index) => {
        console.log(`\n--- Item ${index + 1} ---`);
        console.log('ID:', row.id);
        console.log('Title:', row.title);
        console.log('Type:', row.type);
        console.log('Description:', row.description);
        console.log('File path:', row.file_path);
        console.log('Uploaded by:', row.uploaded_by);
        console.log('Created at:', row.created_at);
        console.log('Size:', row.size, 'bytes', row.size ? `(${(row.size / (1024 * 1024)).toFixed(2)} MB)` : '');
      });
    } else {
      console.log('No content found in the database.');
    }
    
    client.release();
  } catch (err) {
    console.error('Error querying database:', err);
  } finally {
    process.exit();
  }
}

checkContent();
