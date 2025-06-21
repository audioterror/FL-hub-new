const User = require('./models/User');
const Role = require('./models/Role');
const UserService = require('./services/userService');
require('dotenv').config();

async function testUsers() {
  try {
    console.log('Testing user models and services...');
    
    // Получаем все роли
    console.log('\n1. Getting all roles:');
    const roles = await Role.getAll();
    console.log('Roles:', roles);
    
    // Получаем роль BASIC
    console.log('\n2. Getting BASIC role:');
    const basicRole = await Role.getByName('BASIC');
    console.log('BASIC role:', basicRole);
    
    // Получаем ID роли BASIC
    console.log('\n3. Getting BASIC role ID:');
    const basicRoleId = await Role.getBasicRoleId();
    console.log('BASIC role ID:', basicRoleId);
    
    // Получаем всех пользователей
    console.log('\n4. Getting all users:');
    const users = await User.getAll();
    console.log('Users:', users);
    
    // Создаем тестового пользователя
    console.log('\n5. Creating test user:');
    const testUser = await User.create({
      telegram_id: 987654321,
      telegram_username: 'test_user',
      first_name: 'Test',
      last_name: 'User',
      role_id: basicRoleId
    });
    console.log('Created test user:', testUser);
    
    // Получаем пользователя по Telegram ID
    console.log('\n6. Getting user by Telegram ID:');
    const userByTelegramId = await User.getByTelegramId(987654321);
    console.log('User by Telegram ID:', userByTelegramId);
    
    // Получаем роль пользователя
    console.log('\n7. Getting user role:');
    const userRole = await userByTelegramId.getRole();
    console.log('User role:', userRole);
    
    // Проверяем, является ли пользователь VIP
    console.log('\n8. Checking if user is VIP:');
    const isVIP = await userByTelegramId.isVIP();
    console.log('Is VIP:', isVIP);
    
    // Обновляем роль пользователя на VIP
    console.log('\n9. Updating user role to VIP:');
    const vipRole = await Role.getByName('VIP');
    await userByTelegramId.update({ role_id: vipRole.id });
    console.log('Updated user:', userByTelegramId);
    
    // Проверяем, является ли пользователь VIP после обновления
    console.log('\n10. Checking if user is VIP after update:');
    const isVIPAfterUpdate = await userByTelegramId.isVIP();
    console.log('Is VIP after update:', isVIPAfterUpdate);
    
    // Тестируем сервис пользователей
    console.log('\n11. Testing UserService.findOrCreateUserByTelegram:');
    const telegramData = {
      id: 555555555,
      username: 'telegram_user',
      first_name: 'Telegram',
      last_name: 'User'
    };
    const telegramUser = await UserService.findOrCreateUserByTelegram(telegramData);
    console.log('Telegram user:', telegramUser);
    
    // Получаем всех пользователей с информацией о ролях
    console.log('\n12. Getting all users with roles:');
    const usersWithRoles = await UserService.getAllUsersWithRoles();
    console.log('Users with roles:', usersWithRoles);
    
    // Удаляем тестовых пользователей
    console.log('\n13. Deleting test users:');
    await userByTelegramId.delete();
    console.log('Deleted user with Telegram ID 987654321');
    
    const telegramUserFromDB = await User.getByTelegramId(555555555);
    if (telegramUserFromDB) {
      await telegramUserFromDB.delete();
      console.log('Deleted user with Telegram ID 555555555');
    }
    
    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('Error testing users:', error);
  }
}

// Запускаем тесты
testUsers()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Failed to run tests:', error);
    process.exit(1);
  });
