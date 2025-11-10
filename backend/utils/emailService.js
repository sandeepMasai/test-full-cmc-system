const nodemailer = require('nodemailer');
require('dotenv').config();

let emailServiceReady = false;
let emailServiceError = null;

// ✅ Create SMTP transporter
let transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT, 10) || 465,
  secure: parseInt(process.env.EMAIL_PORT, 10) === 465, // true for port 465, false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 10000, // 10s
  socketTimeout: 10000,
  greetingTimeout: 10000,
  tls: {
    rejectUnauthorized: false, // helps bypass some cloud restrictions
  },
});

// ✅ Verify connection on startup
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Email service configuration error:', error.message);
      emailServiceReady = false;
      emailServiceError = error.message;
    } else {
      console.log('✅ Email service is ready');
      console.log(`📨 Using ${process.env.EMAIL_USER} via ${process.env.EMAIL_HOST}`);
      emailServiceReady = true;
    }
  });
} else {
  console.warn('⚠️ EMAIL_USER or EMAIL_PASS not configured in .env');
}

// ✅ Send email function
const sendEmailNotification = async ({ to, subject, text, html }) => {
  if (!to || !subject) {
    console.warn('⚠️ Missing recipient or subject');
    return { success: false, error: 'Invalid parameters' };
  }

  if (!emailServiceReady) {
    console.warn('⚠️ Email service not ready, skipping send');
    return { success: false, error: emailServiceError || 'Service not ready' };
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || `CRM System <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html: html || text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Error sending email to ${to}: ${error.message}`);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendEmailNotification,
  emailServiceReady,
  emailServiceError,
};
