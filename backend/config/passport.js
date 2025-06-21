const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');
const { pool } = require('./db');
require('dotenv').config();

// Сериализация и десериализация пользователя
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.getById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Проверяем, существует ли пользователь с таким Google ID
    let user = await User.getByGoogleId(profile.id);
    
    if (user) {
      return done(null, user);
    }

    // Проверяем, существует ли пользователь с таким email
    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
    if (email) {
      user = await User.getByEmail(email);
      if (user) {
        // Связываем существующий аккаунт с Google
        await pool.query(
          'UPDATE tg_users SET google_id = $1 WHERE id = $2',
          [profile.id, user.id]
        );
        user.google_id = profile.id;
        return done(null, user);
      }
    }

    // Создаем нового пользователя
    const newUser = await User.create({
      google_id: profile.id,
      email: email,
      first_name: profile.name.givenName || 'Пользователь',
      last_name: profile.name.familyName || '',
      photo_url: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
      is_email_verified: true // Google аккаунты считаем верифицированными
    });

    return done(null, newUser);
  } catch (error) {
    console.error('Error in Google Strategy:', error);
    return done(error, null);
  }
}));

// Local Strategy (email/password)
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  try {
    // Ищем пользователя по email
    const user = await User.getByEmail(email);
    
    if (!user) {
      return done(null, false, { message: 'Пользователь с таким email не найден' });
    }

    // Проверяем пароль
    const isValidPassword = await user.verifyPassword(password);
    
    if (!isValidPassword) {
      return done(null, false, { message: 'Неверный пароль' });
    }

    // Проверяем, верифицирован ли email
    if (!user.is_email_verified) {
      return done(null, false, { message: 'Email не верифицирован' });
    }

    return done(null, user);
  } catch (error) {
    console.error('Error in Local Strategy:', error);
    return done(error, null);
  }
}));

module.exports = passport; 