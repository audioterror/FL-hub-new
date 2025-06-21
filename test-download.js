const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

const { API_HOST, API_URL } = require('./frontend/src/config.js');

// Конфигурация
// (адрес API импортируется из config.js)
const CONTENT_ID = 4; // ID контента для скачивания
const OUTPUT_FILE_BASIC = 'download-basic.dat';
const OUTPUT_FILE_VIP = 'download-vip.dat';

// Токены для разных ролей
const BASIC_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjk5OTksInRlbGVncmFtSWQiOjEyMzQ1Njc4OSwicm9sZSI6IkJBU0lDIiwiaWF0IjoxNzQ3NTcyMjkwLCJleHAiOjE3NDc1NzU4OTB9.hH4wcDEnqyBO0MPzRjyY-LLuvgyIfdn3oL0m';
const VIP_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjk5OTksInRlbGVncmFtSWQiOjEyMzQ1Njc4OSwicm9sZSI6IlZJUCIsImlhdCI6MTc0NzU3MjMwOCwiZXhwIjoxNzQ3NTc1OTA4fQ.r32_vhQ81LGaik68JdT9e0HDaumjeolJ7CNyGh';

// Функция для скачивания файла с измерением времени
async function downloadFile(token, outputFile, role) {
  console.log(`Начинаем скачивание файла для роли ${role}...`);

  const startTime = performance.now();

  try {
    const response = await axios({
      method: 'GET',
      url: `${API_URL}/content/${CONTENT_ID}/test-download/${role}`,
      responseType: 'stream'
    });

    // Получаем размер файла из заголовка
    const fileSize = parseInt(response.headers['content-length'] || 0);
    console.log(`Размер файла: ${(fileSize / (1024 * 1024)).toFixed(2)} МБ`);

    // Создаем поток для записи файла
    const writer = fs.createWriteStream(outputFile);

    // Счетчик для отслеживания прогресса
    let downloadedBytes = 0;

    // Обрабатываем события потока
    response.data.on('data', (chunk) => {
      downloadedBytes += chunk.length;
      const progress = (downloadedBytes / fileSize * 100).toFixed(2);
      process.stdout.write(`\rПрогресс: ${progress}% (${(downloadedBytes / (1024 * 1024)).toFixed(2)} МБ)`);
    });

    // Завершаем скачивание
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        const endTime = performance.now();
        const duration = (endTime - startTime) / 1000; // в секундах

        console.log(`\nСкачивание завершено за ${duration.toFixed(2)} секунд`);

        // Рассчитываем среднюю скорость
        const speedMBps = (fileSize / (1024 * 1024)) / duration;
        const speedKBps = speedMBps * 1024;

        console.log(`Средняя скорость: ${speedMBps.toFixed(2)} МБ/с (${speedKBps.toFixed(2)} КБ/с)`);

        resolve({
          fileSize,
          duration,
          speedKBps
        });
      });

      writer.on('error', reject);
    });
  } catch (error) {
    console.error(`Ошибка при скачивании файла для роли ${role}:`, error.message);
    if (error.response) {
      console.error(`Статус ошибки: ${error.response.status}`);
      console.error(`Сообщение: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

// Основная функция для тестирования
async function runTest() {
  try {
    console.log('=== Тестирование скачивания файлов с ограничением скорости ===');

    // Проверяем, что токены заданы
    if (BASIC_TOKEN === 'YOUR_BASIC_TOKEN' || VIP_TOKEN === 'YOUR_VIP_TOKEN') {
      console.error('Ошибка: Необходимо заменить токены в скрипте на реальные токены пользователей.');
      return;
    }

    // Скачиваем файл с токеном BASIC
    console.log('\n--- Тест для пользователя с ролью BASIC ---');
    const basicResult = await downloadFile(BASIC_TOKEN, OUTPUT_FILE_BASIC, 'BASIC');

    // Скачиваем файл с токеном VIP
    console.log('\n--- Тест для пользователя с ролью VIP ---');
    const vipResult = await downloadFile(VIP_TOKEN, OUTPUT_FILE_VIP, 'VIP');

    // Сравниваем результаты
    console.log('\n=== Результаты сравнения ===');
    console.log(`BASIC: ${basicResult.speedKBps.toFixed(2)} КБ/с, Время: ${basicResult.duration.toFixed(2)} с`);
    console.log(`VIP: ${vipResult.speedKBps.toFixed(2)} КБ/с, Время: ${vipResult.duration.toFixed(2)} с`);

    const speedRatio = vipResult.speedKBps / basicResult.speedKBps;
    console.log(`Соотношение скоростей (VIP/BASIC): ${speedRatio.toFixed(2)}x`);

    // Проверяем, что ограничение скорости работает
    if (basicResult.speedKBps <= 210) { // Допускаем небольшое превышение из-за погрешности измерения
      console.log('✅ Ограничение скорости для BASIC работает корректно (около 200 КБ/с)');
    } else {
      console.log('❌ Ограничение скорости для BASIC не работает корректно');
    }

    if (speedRatio >= 1.5) {
      console.log('✅ Пользователи VIP скачивают файлы быстрее, чем пользователи BASIC');
    } else {
      console.log('❌ Разница в скорости скачивания между VIP и BASIC недостаточна');
    }

  } catch (error) {
    console.error('Ошибка при выполнении теста:', error);
  }
}

// Запускаем тест
runTest();
