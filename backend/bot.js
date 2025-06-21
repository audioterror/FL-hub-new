const { Telegraf } = require('telegraf');
const UserService = require('./services/userService');
const AuthToken = require('./models/AuthToken');
const User = require('./models/User');
const Role = require('./models/Role');
const { sendMessageToUser, sendRoleChangeNotification } = require('./services/messageService');
const { pool } = require('./config/db');
require('dotenv').config();

// Получаем токен бота из переменных окружения
const botToken = process.env.TELEGRAM_BOT_TOKEN;

// Создаем экземпляр бота
const bot = new Telegraf(botToken);

// Функция для инициализации бота
const initBot = () => {
  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN не указан в .env файле');
    return false;
  }

  console.log('Инициализация Telegram бота...');

  // Обработка команды /start
  bot.start(async (ctx) => {
    console.log('Получена команда /start');
    console.log('Контекст команды:', JSON.stringify(ctx.message || {}, null, 2));

    const { id, username, first_name, last_name } = ctx.from;
    const startPayload = ctx.startPayload; // Получаем токен из команды /start <токен>

    console.log(`Пользователь ${first_name} (ID: ${id}) запустил бота с токеном: ${startPayload}`);
    console.log('Полные данные пользователя:', JSON.stringify(ctx.from || {}, null, 2));

    try {
      // Создаем или находим пользователя в базе данных
      console.log('Создаем или находим пользователя в базе данных...');
      const user = await UserService.findOrCreateUserByTelegram({
        id,
        username,
        first_name,
        last_name
      });
      console.log('Пользователь в базе данных:', JSON.stringify(user || {}, null, 2));

      // Если есть токен в команде /start, активируем его
      if (startPayload && startPayload.length > 0) {
        console.log(`Активируем токен: ${startPayload}`);
        const activatedToken = await AuthToken.activate(startPayload, id);
        console.log('Результат активации токена:', JSON.stringify(activatedToken || null, null, 2));

        if (activatedToken) {
          console.log('Токен успешно активирован');
          // Отправляем сообщение об успешной авторизации
          await ctx.replyWithMarkdown(
                      `✅ Привет, *${first_name}*! Вы успешно авторизовались в приложении FL Hub.\n\n` +
          '🔄 Теперь вернитесь в приложение, авторизация произойдет автоматически.\n\n' +
            '📋 *Доступные команды:*\n\n' +
            '• /start - Запустить бота\n' +
            '• /help - Получить справку\n' +
            '• /status - Проверить статус аккаунта'
          );
          return;
        } else {
          console.log('Токен недействителен или уже использован');
          // Токен недействителен или уже использован
          await ctx.replyWithMarkdown(
            `❌ Привет, *${first_name}*! К сожалению, ваш токен авторизации недействителен или уже использован.\n\n` +
            '🔄 Пожалуйста, вернитесь в приложение и нажмите кнопку "Войти через Telegram" еще раз.\n\n' +
            '📋 *Доступные команды:*\n\n' +
            '• /start - Запустить бота\n' +
            '• /help - Получить справку\n' +
            '• /status - Проверить статус аккаунта'
          );
          return;
        }
      } else {
        console.log('Токен не предоставлен в команде /start');
      }

      // Если токена нет, отправляем обычное приветственное сообщение
      await ctx.replyWithMarkdown(
        `👋 Привет, *${first_name}*! Я – бот для авторизации в FL Hub.\n\n` +
        '🔐 Для входа в приложение используйте кнопку "Войти через Telegram" в приложении.\n\n' +
        '📋 *Доступные команды:*\n\n' +
        '• /start - Запустить бота\n' +
        '• /help - Получить справку\n' +
        '• /status - Проверить статус аккаунта'
      );
    } catch (error) {
      console.error('Ошибка при обработке команды /start:', error);
      await ctx.reply('Произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте позже.');
    }
  });

  // Обработка команды /help
  bot.help(async (ctx) => {
    try {
      // Находим пользователя в базе данных
      const user = await UserService.findOrCreateUserByTelegram({
        id: ctx.from.id,
        username: ctx.from.username,
        first_name: ctx.from.first_name,
        last_name: ctx.from.last_name
      });

      // Проверяем роль пользователя
      const role = await user.getRole();
      const roleName = role ? role.name : 'BASIC';
      const isAdmin = await user.isAdmin();
      const isCEO = roleName === 'CEO';

      let helpText =
        '🤖 *FL Hub Bot*\n' +
        '_Ваш помощник для работы с приложением FL Hub_\n\n' +
        '📋 *Доступные команды:*\n\n' +
        '• /start - Запустить бота\n' +
        '• /help - Получить справку\n' +
        '• /status - Проверить статус аккаунта\n\n' +
        '🔐 Для входа в приложение используйте кнопку "Войти через Telegram" на сайте.';

      // Добавляем команды для администраторов
      if (isAdmin) {
        helpText += '\n\n👮‍♂️ *Команды администратора:*\n\n';
        helpText += '• /giveadmin @username role [duration] - Изменить роль пользователя\n';
        helpText += '  Доступные роли: BASIC, VIP, ADMIN\n';
        helpText += '  Примеры:\n';
        helpText += '  - /giveadmin @john VIP - выдать VIP без срока\n';
        helpText += '  - /giveadmin @john VIP 3 - выдать VIP на 3 месяца\n';

        // Для ADMIN роли добавляем информацию об ограничениях
        if (roleName === 'ADMIN') {
          helpText += '  Примечание: пользователи с ролью ADMIN не могут назначать роль ADMIN другим пользователям\n';
        }
      }

      // Команды CEO удалены по запросу пользователя

      await ctx.replyWithMarkdown(helpText);
    } catch (error) {
      console.error('Ошибка при обработке команды /help:', error);
      await ctx.reply(
        '🤖 FL Hub Bot\n' +
        'Ваш помощник для работы с приложением FL Hub\n\n' +
        '📋 Доступные команды:\n\n' +
        '• /start - Запустить бота\n' +
        '• /help - Получить справку\n' +
        '• /status - Проверить статус аккаунта\n\n' +
        '🔐 Для входа в приложение используйте кнопку "Войти через Telegram" на сайте.'
      );
    }
  });

  // Обработка команды /status
  bot.command('status', async (ctx) => {
    const { id, username, first_name } = ctx.from;
    console.log(`Пользователь ${first_name} (ID: ${id}) запросил статус`);

    try {
      // Находим пользователя в базе данных
      const user = await UserService.findOrCreateUserByTelegram({
        id,
        username,
        first_name,
        last_name: ctx.from.last_name
      });

      // Получаем роль пользователя
      const role = await user.getRole();
      const roleName = role ? role.name : 'BASIC';

      // Получаем эмодзи для роли
      const roleEmoji = {
        'BASIC': '👤',
        'VIP': '⭐',
        'ADMIN': '🛡️',
        'CEO': '👑'
      };

      const emoji = roleEmoji[roleName] || '🔄';

      // Формируем информацию о статусе
      let statusText =
        `📊 *Информация о вашей учетной записи*\n\n` +
        `🆔 ID: \`${user.id}\`\n` +
        `🔢 Telegram ID: \`${user.telegram_id}\`\n` +
        `👤 Имя: *${user.first_name} ${user.last_name || ''}*\n` +
        `🔤 Username: ${user.telegram_username ? '@' + user.telegram_username : '_не указан_'}\n` +
        `${emoji} Роль: *${roleName}*\n`;

      // Если роль VIP и есть срок действия, добавляем информацию о нем
      if (roleName === 'VIP' && user.vip_expires_at) {
        const expiryDate = new Date(user.vip_expires_at);
        const now = new Date();

        // Проверяем, не истек ли срок
        if (expiryDate > now) {
          // Вычисляем оставшееся время
          const diffMs = expiryDate - now;
          const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

          // Форматируем дату
          const formattedDate = expiryDate.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });

          statusText += `⏳ Срок действия VIP: *до ${formattedDate}* (осталось ${diffDays} дн.)\n`;
        } else {
          statusText += `⚠️ Срок действия VIP *истек*. Роль будет автоматически изменена на BASIC.\n`;
        }
      }

      // Добавляем дату регистрации
      statusText += `📅 Дата регистрации: \`${new Date(user.created_at).toLocaleString('ru-RU')}\``;

      // Отправляем информацию о статусе
      await ctx.replyWithMarkdown(statusText);
    } catch (error) {
      console.error('Ошибка при обработке команды /status:', error);
      await ctx.reply('Произошла ошибка при получении статуса. Пожалуйста, попробуйте позже.');
    }
  });

  // Команда /role удалена, используйте /giveadmin

  // Обработка команды /giveadmin для изменения роли пользователя по username (только для администраторов)
  bot.command('giveadmin', async (ctx) => {
    const { id, username, first_name } = ctx.from;
    console.log(`Пользователь ${first_name} (ID: ${id}) запросил изменение роли через /giveadmin`);

    try {
      // Находим пользователя в базе данных
      const admin = await UserService.findOrCreateUserByTelegram({
        id,
        username,
        first_name,
        last_name: ctx.from.last_name
      });

      // Проверяем, является ли пользователь администратором
      const isAdmin = await admin.isAdmin();
      if (!isAdmin) {
        await ctx.reply('⛔ У вас нет прав для изменения ролей пользователей. Эта команда доступна только администраторам.');
        return;
      }

      // Получаем аргументы команды: /giveadmin @username role [duration]
      const args = ctx.message.text.split(' ').slice(1);
      if (args.length < 2 || args.length > 3) {
        await ctx.reply(
          '⚠️ Неверный формат команды.\n\n' +
          'Используйте: /giveadmin @username role [duration]\n\n' +
          'Примеры:\n' +
          '• /giveadmin @john VIP - выдать VIP без срока\n' +
          '• /giveadmin @john VIP 3 - выдать VIP на 3 месяца\n\n' +
          'Доступные роли: BASIC, VIP, ADMIN\n' +
          'Срок (duration) указывается только для роли VIP в месяцах'
        );
        return;
      }

      let targetUsername = args[0];
      // Удаляем @ из имени пользователя, если он есть
      if (targetUsername.startsWith('@')) {
        targetUsername = targetUsername.substring(1);
      }

      const newRoleName = args[1].toUpperCase();

      // Проверяем, указан ли срок действия
      let durationMonths = null;
      if (args.length === 3) {
        // Проверяем, что третий аргумент - число
        if (!/^\d+$/.test(args[2])) {
          await ctx.reply('⚠️ Срок действия должен быть указан числом месяцев. Например: /giveadmin @john VIP 3');
          return;
        }

        durationMonths = parseInt(args[2]);

        // Проверяем, что срок действия указан только для VIP
        if (newRoleName !== 'VIP') {
          await ctx.reply('⚠️ Срок действия можно указать только для роли VIP.');
          return;
        }
      }

      // Проверяем, существует ли такая роль
      const validRoles = ['BASIC', 'VIP', 'ADMIN'];

      // CEO роль нельзя назначить через команду /giveadmin
      // Даже если текущий пользователь имеет роль CEO

      if (!validRoles.includes(newRoleName)) {
        let errorMessage = `⚠️ Роль "${newRoleName}" не существует или вы не имеете прав для ее назначения.\n\n`;

        if (newRoleName === 'CEO') {
          errorMessage = '⛔ Роль CEO нельзя назначить другим пользователям. Эта роль зарезервирована для владельца проекта.\n\n';
        }

        errorMessage += 'Доступные роли: ' + validRoles.join(', ');

        await ctx.reply(errorMessage);
        return;
      }

      // Получаем роль администратора
      const adminRole = await admin.getRole();
      const adminRoleName = adminRole ? adminRole.name : 'BASIC';

      // Проверяем, может ли пользователь назначать указанную роль
      if (adminRoleName === 'ADMIN' && newRoleName === 'ADMIN') {
        await ctx.reply('⛔ Пользователи с ролью ADMIN не могут назначать роль ADMIN другим пользователям. Эта возможность доступна только для CEO.');
        return;
      }

      // Получаем всех пользователей
      const allUsers = await User.getAll();

      // Находим пользователя по username
      const targetUser = allUsers.find(user =>
        user.telegram_username &&
        user.telegram_username.toLowerCase() === targetUsername.toLowerCase()
      );

      if (!targetUser) {
        await ctx.reply(`⚠️ Пользователь с username @${targetUsername} не найден в базе данных.`);
        return;
      }

      // Получаем текущую роль пользователя
      const currentRole = await targetUser.getRole();
      const currentRoleName = currentRole ? currentRole.name : 'BASIC';

      // Если роль не изменилась, сообщаем об этом
      if (currentRoleName === newRoleName) {
        await ctx.reply(`ℹ️ Пользователь ${targetUser.first_name} (@${targetUser.telegram_username}) уже имеет роль ${newRoleName}.`);
        return;
      }

      // Изменяем роль пользователя
      if (newRoleName === 'VIP' && durationMonths) {
        // Если указан срок действия для VIP
        // Вычисляем дату истечения срока действия
        const now = new Date();
        const expiryDate = new Date(now);
        expiryDate.setMonth(now.getMonth() + durationMonths);

        // Обновляем роль пользователя с указанием срока действия
        await targetUser.update({
          role_id: (await Role.getByName('VIP')).id,
          vip_expires_at: expiryDate
        });

        // Отправляем уведомление пользователю
        await sendRoleChangeNotification(targetUser.telegram_id, newRoleName, durationMonths);

        // Форматируем дату для отображения
        const formattedDate = expiryDate.toLocaleDateString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });

        // Отправляем сообщение об успешном изменении роли
        await ctx.reply(
          `✅ Роль пользователя ${targetUser.first_name} (@${targetUser.telegram_username}) изменена с ${currentRoleName} на ${newRoleName}.\n\n` +
          `Срок действия: ${durationMonths} мес. (до ${formattedDate})\n\n` +
          `Пользователю отправлено уведомление об изменении роли.`
        );
      } else {
        // Если срок действия не указан или роль не VIP
        await UserService.changeUserRole(targetUser.id, newRoleName);

        // Отправляем сообщение об успешном изменении роли
        await ctx.reply(
          `✅ Роль пользователя ${targetUser.first_name} (@${targetUser.telegram_username}) изменена с ${currentRoleName} на ${newRoleName}.\n\n` +
          `Пользователю отправлено уведомление об изменении роли.`
        );
      }
    } catch (error) {
      console.error('Ошибка при обработке команды /giveadmin:', error);

      // Проверяем, является ли ошибка связанной с изменением роли CEO
      if (error.message && error.message.includes('Cannot change role for users with CEO role')) {
        await ctx.reply('⛔ Невозможно изменить роль пользователя с ролью CEO. Эта роль является неизменяемой.');
      } else if (error.message && error.message.includes('Cannot assign CEO role to other users')) {
        await ctx.reply('⛔ Невозможно назначить роль CEO другим пользователям. Эта роль зарезервирована для владельца проекта.');
      } else {
        await ctx.reply('Произошла ошибка при изменении роли. Пожалуйста, попробуйте позже.');
      }
    }
  });

  // Команды для управления базой данных через бота удалены по запросу пользователя

  // Логирование всех текстовых сообщений
  bot.on('text', (ctx) => {
    const { id, username, first_name } = ctx.from;
    console.log(`Сообщение от пользователя ${first_name} (ID: ${id}): ${ctx.message.text}`);
  });

  // Команда /sms удалена по запросу пользователя

  // Обработка всех остальных сообщений
  bot.on('message', async (ctx) => {
    if (ctx.message.text && !ctx.message.text.startsWith('/')) {
      await ctx.reply('Я понимаю только команды. Используйте /help для получения списка доступных команд.');
    }
  });

  // Обработка ошибок
  bot.catch((err, ctx) => {
    console.error(`Ошибка для ${ctx.updateType}`, err);
  });

  // Запуск бота
  bot.launch()
    .then(() => {
      console.log('Telegram бот успешно запущен');
    })
    .catch((error) => {
      console.error('Ошибка при запуске Telegram бота:', error);
      return false;
    });

  // Корректное завершение работы бота при остановке приложения
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));

  return true;
};

// Функции для отправки сообщений перенесены в services/messageService.js

module.exports = {
  initBot,
  bot
};
