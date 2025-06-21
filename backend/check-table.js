const { pool } = require('./config/db');

async function checkTable() {
  try {
    // Проверяем, существует ли таблица auth_tokens
    const tableCheck = await pool.query(
      `SELECT EXISTS (
         SELECT FROM information_schema.tables 
         WHERE table_schema = 'public' 
         AND table_name = 'auth_tokens'
       );`
    );
    
    const tableExists = tableCheck.rows[0].exists;
    console.log('Table auth_tokens exists:', tableExists);
    
    if (tableExists) {
      // Проверяем структуру таблицы
      const columnsCheck = await pool.query(
        `SELECT column_name, data_type 
         FROM information_schema.columns 
         WHERE table_schema = 'public' 
         AND table_name = 'auth_tokens';`
      );
      
      console.log('Table structure:');
      columnsCheck.rows.forEach(column => {
        console.log(`- ${column.column_name} (${column.data_type})`);
      });
      
      // Проверяем количество записей в таблице
      const countCheck = await pool.query('SELECT COUNT(*) FROM auth_tokens;');
      console.log('Number of records:', countCheck.rows[0].count);
    }
  } catch (error) {
    console.error('Error checking table:', error);
  } finally {
    // Закрываем соединение с базой данных
    await pool.end();
  }
}

checkTable();
