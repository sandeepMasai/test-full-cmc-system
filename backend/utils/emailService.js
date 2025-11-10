const nodemailer = require('nodemailer');
require('dotenv').config();

let ioInstance = null;
let emailServiceReady = false;
let emailServiceError = null;

// Create transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: parseInt(process.env.EMAIL_PORT) === 465, // auto secure if using 465
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production' // stricter in prod
    }
});

// Verify transporter
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter.verify((error, success) => {
        if (error) {
            console.error('❌ Email service configuration error:', error.message);
            emailServiceReady = false;
            emailServiceError = error.message;
        } else {
            console.log('✅ Email service is ready to send messages');
            console.log(`   Using: ${process.env.EMAIL_USER} via ${process.env.EMAIL_HOST || 'smtp.gmail.com'}`);
            emailServiceReady = true;
        }
    });
} else {
    console.warn('⚠️  Email service not configured. Set EMAIL_USER and EMAIL_PASS in .env file.');
}

const sendEmailNotification = async ({ to, subject, text, html }) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log(`📧 Email skipped: not configured (${subject} to ${to})`);
        return { skipped: true, reason: 'Email service not configured' };
    }

    if (!to || !subject) {
        console.warn('⚠️ Missing recipient or subject');
        return { success: false, error: 'Invalid parameters' };
    }

    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM || `CRM System <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html: html || text
        };

        const info = await transporter.sendMail(mailOptions);
        if (process.env.NODE_ENV !== 'production') {
            console.log(`✅ Email sent successfully to ${to}: ${info.messageId}`);
        }
        return { success: true, messageId: info.messageId, info };
    } catch (error) {
        console.error(`❌ Error sending email to ${to}: ${error.message}`);
        return { success: false, error: error.message, details: error };
    }
};

module.exports = {
    sendEmailNotification,
    emailServiceReady,
    emailServiceError
};
