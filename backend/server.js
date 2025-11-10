const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
require('dotenv').config();

const { sequelize } = require('./config/database');
const authRoutes = require('./routes/auth');
const leadRoutes = require('./routes/leads');
const activityRoutes = require('./routes/activities');
const dashboardRoutes = require('./routes/dashboard');
const notificationRoutes = require('./routes/notifications');
const { router: integrationRoutes } = require('./routes/integrations');
const { authenticateToken } = require('./middleware/auth');
const { initializeSocket } = require('./socket/socketHandler');

const app = express();
const server = http.createServer(app);

// Allowed origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://crm-system-challenge.onrender.com',
  'https://crm-system-challenge-1.onrender.com',
  'https://test-full-cmc-system-1.onrender.com',
];

// Socket.io setup
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    // No credentials needed - using token-based auth
  },
});

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) callback(null, true);
      else {
        console.warn(`❌ CORS blocked: ${origin}`);
        callback(new Error(`CORS policy: Origin ${origin} not allowed.`));
      }
    },
    credentials: false, // Explicitly disable credentials - using token-based auth with localStorage
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

initializeSocket(io);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Test route to verify API routing works
app.post('/api/test', (req, res) => {
  res.json({ status: 'ok', message: 'API routing is working', body: req.body });
});

// API Routes - must be before static file serving
app.use('/api/auth', authRoutes);
app.use('/api/leads', authenticateToken, leadRoutes);
app.use('/api/activities', authenticateToken, activityRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);
app.use('/api/notifications', authenticateToken, notificationRoutes);
app.use('/api/integrations', integrationRoutes);

// ✅ Serve React frontend correctly in production
// IMPORTANT: This must be AFTER all API routes
if (process.env.NODE_ENV === 'production') {
  const __dirname = path.resolve();
  app.use(express.static(path.join(__dirname, 'client', 'dist')));

  // Catch-all route for React Router - only for GET requests
  // This won't interfere with API POST/PUT/DELETE requests
  app.get('*', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ message: 'API route not found' });
    }
    res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
  });
}

// Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Start Server
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  sequelize
    .authenticate()
    .then(() => {
      console.log('✅ Database connection established.');
      return sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    })
    .then(() => {
      server.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`🌐 Allowed Origins: ${allowedOrigins.join(', ')}`);
      });
    })
    .catch((err) => {
      console.error('❌ Database connection failed:', err);
      process.exit(1);
    });
}

module.exports = { app, server, io };
