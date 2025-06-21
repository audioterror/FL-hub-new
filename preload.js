const { contextBridge, ipcRenderer } = require('electron');

// Экспортируем API для использования в рендерере
contextBridge.exposeInMainWorld('electron', {
  // API для выбора директории
  selectDirectory: async (options) => {
    return await ipcRenderer.invoke('select-directory', options);
  },

  // API для сохранения файла
  saveFile: async (data, filePath, fileName) => {
    return await ipcRenderer.invoke('save-file', { data, filePath, fileName });
  },

  // API для получения информации о системе
  getSystemInfo: async () => {
    return await ipcRenderer.invoke('get-system-info');
  },

  // API для проверки существования пути
  pathExists: async (path) => {
    return await ipcRenderer.invoke('path-exists', path);
  },

  // API для создания директории
  createDirectory: async (path) => {
    return await ipcRenderer.invoke('create-directory', path);
  },

  // API для управления окном (минимизация, максимизация, закрытие)
  windowControl: (action) => {
    ipcRenderer.send('window-control', action);
  }
});

// Логирование для отладки
console.log('Preload script loaded');

// Выполняется, когда DOM готов
window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM is fully loaded');

  // Функция для замены текста в элементах
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector);
    if (element) element.innerText = text;
  };

  // Добавляем информацию о версиях, если элементы существуют
  for (const dependency of ['chrome', 'node', 'electron']) {
    try {
      replaceText(`${dependency}-version`, process.versions[dependency]);
    } catch (err) {
      console.error(`Error setting ${dependency} version:`, err);
    }
  }
});

// Обработка ошибок
window.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.error);
});

// Экспортируем защищенные методы, которые позволяют рендерер-процессу использовать
// ipcRenderer без доступа ко всему объекту
contextBridge.exposeInMainWorld('electronAPI', {
  // Пример метода для отправки сообщений в основной процесс
  sendMessage: (channel, data) => {
    // Белый список каналов
    const validChannels = ['toMain', 'app-ready'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  // Пример метода для получения сообщений от основного процесса
  receiveMessage: (channel, func) => {
    const validChannels = ['fromMain', 'app-message'];
    if (validChannels.includes(channel)) {
      // Намеренно удаляем event, так как он включает `sender`
      ipcRenderer.on(channel, (_event, ...args) => func(...args));
    }
  }
});
