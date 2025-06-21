const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  // Отправить письмо для верификации email
  async sendVerificationEmail(email, token) {
    try {
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
      
      const mailOptions = {
        from: `FL Hub <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Подтверждение email - FL Hub',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">FL Hub</h1>
            </div>
            
            <div style="padding: 30px; background: #f8f9fa;">
              <h2 style="color: #333; margin-bottom: 20px;">Подтверждение email</h2>
              
              <p style="color: #666; font-size: 16px; line-height: 1.5;">
                Добро пожаловать в FL Hub! Для завершения регистрации подтвердите ваш email адрес.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 15px 30px; 
                          text-decoration: none; 
                          border-radius: 25px; 
                          font-weight: bold;
                          display: inline-block;">
                  Подтвердить email
                </a>
              </div>
              
              <p style="color: #999; font-size: 14px;">
                Если кнопка не работает, скопируйте и вставьте эту ссылку в браузер:
                <br>
                <a href="${verificationUrl}" style="color: #667eea;">${verificationUrl}</a>
              </p>
              
              <p style="color: #999; font-size: 12px; margin-top: 30px;">
                Если вы не регистрировались на FL Hub, просто проигнорируйте это письмо.
              </p>
            </div>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Verification email sent to ${email}`);
      return true;
    } catch (error) {
      console.error(`Error sending verification email to ${email}:`, error);
      throw error;
    }
  }

  // Отправить письмо для сброса пароля
  async sendPasswordResetEmail(email, token) {
    try {
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
      
      const mailOptions = {
        from: `FL Hub <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Сброс пароля - FL Hub',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">FL Hub</h1>
            </div>
            
            <div style="padding: 30px; background: #f8f9fa;">
              <h2 style="color: #333; margin-bottom: 20px;">Сброс пароля</h2>
              
              <p style="color: #666; font-size: 16px; line-height: 1.5;">
                Вы запросили сброс пароля для вашего аккаунта FL Hub. 
                Нажмите на кнопку ниже, чтобы создать новый пароль.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 15px 30px; 
                          text-decoration: none; 
                          border-radius: 25px; 
                          font-weight: bold;
                          display: inline-block;">
                  Сбросить пароль
                </a>
              </div>
              
              <p style="color: #999; font-size: 14px;">
                Если кнопка не работает, скопируйте и вставьте эту ссылку в браузер:
                <br>
                <a href="${resetUrl}" style="color: #667eea;">${resetUrl}</a>
              </p>
              
              <p style="color: #e74c3c; font-size: 14px; margin-top: 20px;">
                <strong>Важно:</strong> Ссылка действительна только в течение 1 часа.
              </p>
              
              <p style="color: #999; font-size: 12px; margin-top: 30px;">
                Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.
              </p>
            </div>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Password reset email sent to ${email}`);
      return true;
    } catch (error) {
      console.error(`Error sending password reset email to ${email}:`, error);
      throw error;
    }
  }
}

module.exports = new EmailService(); 