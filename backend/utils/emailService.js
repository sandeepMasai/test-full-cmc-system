const nodemailer = require('nodemailer');
require('dotenv').config();

let emailServiceReady = false;
let emailServiceError = null;
let transporter = null;

// ✅ Create SMTP transporter (lazy initialization)
const createTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: parseInt(process.env.EMAIL_PORT, 10) === 465, // true for port 465, false for 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 5000, // 5s - reduced timeout
    socketTimeout: 5000,
    greetingTimeout: 5000,
    tls: {
      rejectUnauthorized: false, // helps bypass some cloud restrictions
    },
    // Add pool option for better connection handling
    pool: false,
    // Disable verification on startup - verify on first use instead
    requireTLS: false,
  });

  return transporter;
};

// ✅ Verify connection asynchronously (non-blocking)
const verifyEmailService = async () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️ EMAIL_USER or EMAIL_PASS not configured - email service disabled');
    emailServiceReady = false;
    return;
  }

  try {
    const trans = createTransporter();
    // Use promise-based verify with timeout
    const verifyPromise = new Promise((resolve, reject) => {
      trans.verify((error, success) => {
        if (error) reject(error);
        else resolve(success);
      });
    });

    // Add timeout wrapper
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Email verification timeout')), 5000);
    });

    await Promise.race([verifyPromise, timeoutPromise]);
    
    console.log('✅ Email service is ready');
    console.log(`📨 Using ${process.env.EMAIL_USER} via ${process.env.EMAIL_HOST || 'smtp.gmail.com'}`);
    emailServiceReady = true;
    emailServiceError = null;
  } catch (error) {
    console.warn('⚠️ Email service verification failed (will retry on first use):', error.message);
    emailServiceReady = false;
    emailServiceError = error.message;
    // Don't throw - allow server to start even if email fails
  }
};

// Start verification in background (non-blocking)
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  // Don't await - let it run in background
  verifyEmailService().catch(() => {
    // Already handled in verifyEmailService
  });
} else {
  console.warn('⚠️ EMAIL_USER or EMAIL_PASS not configured - email service disabled');
}

// ✅ Send email function
const sendEmailNotification = async ({ to, subject, text, html }) => {
  if (!to || !subject) {
    console.warn('⚠️ Missing recipient or subject');
    return { success: false, error: 'Invalid parameters' };
  }

  // Check if email credentials are configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️ Email credentials not configured, skipping send');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const trans = createTransporter();
    
    // If service wasn't ready, try to verify now (lazy verification)
    if (!emailServiceReady) {
      console.log('🔄 Attempting to verify email service...');
      await verifyEmailService();
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || `CRM System <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html: html || text,
    };

    // Add timeout to sendMail
    const sendPromise = trans.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Email send timeout')), 10000);
    });

    const info = await Promise.race([sendPromise, timeoutPromise]);
    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Error sending email to ${to}: ${error.message}`);
    // Don't throw - just return error so app continues
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendEmailNotification,
  emailServiceReady,
  emailServiceError,
};
