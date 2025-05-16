const express = require('express');
const cors = require('cors');
const { pool, pingDatabase } = require('./db');  // Added pingDatabase import
const studentRoutes = require('./routes/students');
const entryRoutes = require('./routes/entries');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const setupDatabase = require('./utils/setupDatabase');
const cron = require('node-cron');
const sendDailySummary = require('./jobs/dailySummary'); // Only import it once

const app = express();

// Enhanced CORS settings
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], // Frontend URLs
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Graceful setup - don't crash on database setup errors
setupDatabase()
  .then(() => console.log('✅ Database initialization complete'))
  .catch(err => console.error('❌ Database initialization error, continuing anyway:', err.message));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connectivity
    await pingDatabase();
    res.status(200).json({ 
      status: 'healthy',
      database: 'connected', 
      timestamp: new Date().toISOString() 
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'unhealthy',
      database: 'disconnected', 
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Routes
app.use('/api/students', studentRoutes);
app.use('/api/entries', entryRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Application error:', err.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Something went wrong', 
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message 
    });
});

// Temporary testing route for daily summary (No need to re-import here)
app.get('/test-summary', async (req, res) => {
  console.log('Test summary route hit');  // Add this log
  try {
    await sendDailySummary();
    res.send('📧 Summary sent successfully!');
  } catch (err) {
    console.error('❌ Summary sending failed:', err.message);
    res.status(500).send('❌ Failed to send summary.');
  }
});


// Server listen
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📚 Library Management System API - PostgreSQL Edition`);
});

// Enhanced graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`${signal} signal received: starting graceful shutdown`);
  
  // First stop accepting new requests
  server.close(() => {
    console.log('HTTP server closed, closing database connections');
    
    // Then close all database connections
    pool.end()
      .then(() => {
        console.log('✅ Database connections closed successfully');
        process.exit(0);
      })
      .catch(err => {
        console.error('❌ Error closing database connections:', err.message);
        process.exit(1);
      });
  });
  
  // If server hasn't closed in 10 seconds, force shutdown
  setTimeout(() => {
    console.error('⚠️ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle common termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions and rejections
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught exception:', err);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled promise rejection at:', promise, 'reason:', reason);
  // Don't exit for unhandled rejections - log but continue running
});
