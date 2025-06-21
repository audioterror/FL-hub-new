const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

// Получение информации о сервере
router.get('/info', (req, res) => {
  res.json({
    name: 'FL Hub API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Тестовый маршрут для проверки подключения к БД
router.get('/db-test', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as time');
    client.release();
    
    res.json({
      status: 'ok',
      message: 'Database connection successful',
      time: result.rows[0].time
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message
    });
  }
});

module.exports = router;
