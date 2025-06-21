const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Role = require('../models/Role');
const { authenticateToken } = require('../middleware/auth');
const { sendSubscriptionNotification } = require('../services/telegramService');

// Получить информацию о планах подписки
router.get('/plans', (req, res) => {
  // Планы подписки с ценами и скидками
  const plans = [
    {
      id: 1,
      name: '1 месяц',
      months: 1,
      price: 249,
      discount: 0,
      description: 'Идеально для короткого проекта'
    },
    {
      id: 3,
      name: '3 месяца',
      months: 3,
      price: 649,
      discount: 15,
      description: 'Выгоднее на 15%'
    },
    {
      id: 6,
      name: '6 месяцев',
      months: 6,
      price: 1119,
      discount: 25,
      description: 'Выгоднее на 25%'
    },
    {
      id: 9,
      name: '9 месяцев',
      months: 9,
      price: 1499,
      discount: 30,
      description: 'Выгоднее на 30%'
    },
    {
      id: 12,
      name: '12 месяцев',
      months: 12,
      price: 1799,
      discount: 35,
      description: 'Выгоднее на 35%'
    }
  ];

  res.json(plans);
});

// Получить информацию о подписке текущего пользователя
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Получаем пользователя
    const user = await User.getById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Получаем роль пользователя
    const role = await user.getRole();
    const roleName = role ? role.name : 'BASIC';

    // Проверяем, является ли пользователь VIP
    const isVIP = await user.isVIP();

    // Если пользователь не VIP, возвращаем базовую информацию
    if (!isVIP || roleName !== 'VIP') {
      return res.json({
        is_vip: false,
        role: roleName,
        message: 'У вас нет активной VIP-подписки'
      });
    }

    // Если пользователь VIP, возвращаем информацию о подписке
    const daysLeft = user.getVIPDaysLeft();
    const expiryDate = user.vip_expires_at ? new Date(user.vip_expires_at) : null;

    res.json({
      is_vip: true,
      role: roleName,
      days_left: daysLeft,
      expiry_date: expiryDate,
      is_permanent: !user.vip_expires_at
    });
  } catch (error) {
    console.error('Error getting subscription info:', error);
    res.status(500).json({ error: 'Failed to get subscription info' });
  }
});

// Создать заявку на оплату подписки
router.post('/payment-request', authenticateToken, async (req, res) => {
  try {
    const { plan_id } = req.body;

    if (!plan_id) {
      return res.status(400).json({ error: 'plan_id is required' });
    }

    // Пользователь уже доступен из middleware authenticateToken
    const user = req.user;

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Creating payment request for user:', user.id, 'Plan ID:', plan_id);

    // Получаем информацию о плане
    const plans = [
      { id: 1, name: '1 месяц', months: 1, price: 249 },
      { id: 3, name: '3 месяца', months: 3, price: 649 },
      { id: 6, name: '6 месяцев', months: 6, price: 1119 },
      { id: 9, name: '9 месяцев', months: 9, price: 1499 },
      { id: 12, name: '12 месяцев', months: 12, price: 1799 }
    ];

    const plan = plans.find(p => p.id === parseInt(plan_id));

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Генерируем уникальный идентификатор платежа
    const paymentId = Math.floor(Math.random() * 1000000000);

    // Формируем комментарий к платежу
    const comment = `${plan.name} (${user.telegram_id})`;

    console.log('Generated payment comment:', comment);

    // Информация о платеже
    const paymentInfo = {
      payment_id: paymentId,
      plan: plan,
      user: {
        id: user.id,
        telegram_id: user.telegram_id,
        telegram_username: user.telegram_username
      },
      payment_details: {
        card_number: '2204 3101 5324 2113',
        bank: 'Яндекс пей',
        comment: comment,
        amount: plan.price
      }
    };

    console.log('Payment info created:', paymentInfo);

    res.json(paymentInfo);
  } catch (error) {
    console.error('Error creating payment request:', error);
    res.status(500).json({ error: 'Failed to create payment request' });
  }
});

module.exports = router;
