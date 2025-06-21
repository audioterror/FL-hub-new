const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const url = require('url');

// Включаем логирование
console.log('Starting Electron application...');
console.log('Current directory:', __dirname);
console.log('Node environment:', process.env.NODE_ENV || 'not set');

// Keep a global reference of the window object to prevent it from being garbage collected
let mainWindow;

function createWindow() {
  console.log('Creating main window...');

  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1560, // 1200 * 1.3 = 1560
    height: 1040, // 800 * 1.3 = 1040
    minWidth: 1000, // Минимальная ширина окна
    minHeight: 700, // Минимальная высота окна
    center: true, // Центрируем окно на экране
    show: false, // Не показывать окно до полной загрузки
    backgroundColor: '#1a1a1a', // Темный фон для предотвращения белой вспышки
    frame: false, // Убираем стандартную рамку окна
    titleBarStyle: 'hidden', // Скрываем стандартный заголовок
    autoHideMenuBar: true, // Скрываем меню
    roundedCorners: true, // Скругленные углы (для Windows 11)
    webPreferences: {
      nodeIntegration: false, // Более безопасно
      contextIsolation: true, // Более безопасно
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Показать окно, когда оно готово
  mainWindow.once('ready-to-show', () => {
    console.log('Window ready to show');
    mainWindow.show();
  });

  // Определяем URL для загрузки
  // Принудительно устанавливаем режим разработки для отладки
  process.env.NODE_ENV = 'development';
  const isDev = process.env.NODE_ENV === 'development';
  console.log('Is development mode:', isDev);

  const VITE_DEV_SERVER = 'http://158.160.178.28:5174';

  // В режиме разработки загружаем с сервера Vite
  const startUrl = isDev
    ? VITE_DEV_SERVER // Vite dev server - порт 5174, так как 5173 занят
    : url.format({
        pathname: path.join(__dirname, 'frontend/dist/index.html'),
        protocol: 'file:',
        slashes: true
      });

  console.log('Loading URL:', startUrl);

  // Загружаем URL
  mainWindow.loadURL(startUrl)
    .then(() => {
      console.log('URL loaded successfully');
    })
    .catch(err => {
      console.error('Failed to load URL:', err);
      // Показываем ошибку в окне
      mainWindow.loadURL(`data:text/html,
        <html>
          <head>
            <title>Error</title>
            <style>
              body {
                background-color: #1e1e1e;
                color: #f8f8f8;
                font-family: Arial, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                padding: 20px;
                text-align: center;
              }
              h1 { color: #ff5555; }
              pre {
                background-color: #2d2d2d;
                padding: 15px;
                border-radius: 5px;
                max-width: 80%;
                overflow: auto;
              }
            </style>
          </head>
          <body>
            <h1>Failed to load application</h1>
            <p>Could not connect to development server. Make sure Vite is running.</p>
            <pre>${err.message}</pre>
          </body>
        </html>
      `);
    });

  // Open DevTools in development mode
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Emitted when the window is closed
  mainWindow.on('closed', function () {
    console.log('Window closed');
    // Dereference the window object
    mainWindow = null;
  });
}

// Обработка IPC сообщений от рендерера
ipcMain.on('toMain', (event, message) => {
  console.log('Received message from renderer:', message);
  // Можно ответить рендереру
  event.sender.send('fromMain', 'Message received!');
});

// Обработка сообщения о готовности приложения
ipcMain.on('app-ready', (_event) => {
  console.log('Renderer process is ready');
});

// Обработчик для выбора директории
ipcMain.handle('select-directory', async (_event, options) => {
  console.log('Select directory request with options:', options);

  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: options?.title || 'Выберите папку',
      defaultPath: options?.defaultPath || app.getPath('downloads')
    });

    console.log('Directory selection result:', result);
    return result;
  } catch (error) {
    console.error('Error selecting directory:', error);
    return { canceled: true, error: error.message };
  }
});

// Обработчик для сохранения файла
ipcMain.handle('save-file', async (_event, { data, filePath, fileName }) => {
  console.log(`Save file request: ${fileName} to ${filePath}`);

  try {
    const fs = require('fs');
    const path = require('path');

    // Проверяем, существует ли директория
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(filePath, { recursive: true });
    }

    const fullPath = path.join(filePath, fileName);

    // Если data - это строка, сохраняем как текст
    // Если data - это Buffer или ArrayBuffer, сохраняем как бинарные данные
    if (typeof data === 'string') {
      fs.writeFileSync(fullPath, data);
    } else {
      // Преобразуем ArrayBuffer в Buffer, если необходимо
      const buffer = data instanceof ArrayBuffer ? Buffer.from(data) : data;
      fs.writeFileSync(fullPath, buffer);
    }

    return { success: true, path: fullPath };
  } catch (error) {
    console.error('Error saving file:', error);
    return { success: false, error: error.message };
  }
});

// Обработчик для получения информации о системе
ipcMain.handle('get-system-info', async () => {
  return {
    platform: process.platform,
    arch: process.arch,
    version: app.getVersion(),
    electronVersion: process.versions.electron,
    chromeVersion: process.versions.chrome,
    nodeVersion: process.versions.node,
    userDataPath: app.getPath('userData'),
    downloadsPath: app.getPath('downloads')
  };
});

// Обработчик для проверки существования пути
ipcMain.handle('path-exists', async (_event, path) => {
  try {
    const fs = require('fs');
    return fs.existsSync(path);
  } catch (error) {
    console.error('Error checking path existence:', error);
    return false;
  }
});

// Обработчик для создания директории
ipcMain.handle('create-directory', async (_event, path) => {
  try {
    const fs = require('fs');
    fs.mkdirSync(path, { recursive: true });
    return true;
  } catch (error) {
    console.error('Error creating directory:', error);
    return false;
  }
});

// Обработчик для управления окном (минимизация, максимизация, закрытие)
ipcMain.on('window-control', (_event, action) => {
  console.log(`Window control action: ${action}`);

  if (!mainWindow) {
    console.error('Main window is not available');
    return;
  }

  switch (action) {
    case 'minimize':
      mainWindow.minimize();
      break;
    case 'maximize':
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
      break;
    case 'close':
      mainWindow.close();
      break;
    default:
      console.error(`Unknown window control action: ${action}`);
  }
});

// Обработка необработанных исключений
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception in main process:', error);

  // Показываем диалог с ошибкой в production
  if (process.env.NODE_ENV !== 'development') {
    dialog.showErrorBox(
      'An error occurred',
      `Error: ${error.message}\n\nThe application will now restart.`
    );

    // Перезапускаем приложение
    app.relaunch();
    app.exit(0);
  }
});

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  console.log('Electron app is ready');
  createWindow();
}).catch(err => {
  console.error('Error during app initialization:', err);
});

// Quit when all windows are closed
app.on('window-all-closed', function () {
  console.log('All windows closed');
  // On macOS it is common for applications to stay open until the user quits explicitly
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  console.log('App activated');
  // On macOS it's common to re-create a window when the dock icon is clicked
  if (mainWindow === null) createWindow();
});

// Log when app is quitting
app.on('quit', () => {
  console.log('Application is quitting');
});
