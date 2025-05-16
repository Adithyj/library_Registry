// db.js
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();  // <-- load .env

// Cache successful connections to avoid timeout issues
let lastSuccessfulConnection = null;
let connectionAttemptTime = null;

// Create a connection pool with timeout-resistant configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'library_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
  // Connection pool settings for better performance
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client can be idle before being closed
  connectionTimeoutMillis: 5000, // How long to wait for connection
  // Log slow queries (over 200ms)
  statement_timeout: 60000, // Timeout queries after 60 seconds
});

// Single shared client for critical operations
let dedicatedClient = null;
let isReconnecting = false;

// Enhanced error handling for unexpected terminations
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
});

pool.on('connect', () => {
  console.log('Connection to PostgreSQL established');
});

// Get a dedicated client for operations that need a stable connection
const getDedicatedClient = async () => {
  if (dedicatedClient && !dedicatedClient._ending && !dedicatedClient._ended) {
    try {
      // Test if the connection is still alive
      await dedicatedClient.query('SELECT 1');
      return dedicatedClient;
    } catch (err) {
      console.log('⚠️ Dedicated client is no longer usable, getting a new one');
      // Will get a new client below
    }
  }
  
  if (isReconnecting) {
    throw new Error('Already attempting to reconnect dedicated client');
  }
  
  isReconnecting = true;
  
  try {
    // Release old client if it exists
    if (dedicatedClient) {
      try {
        await dedicatedClient.end();
      } catch (err) {
        // Ignore errors when ending old client
      }
    }
    
    // Get a new client
    dedicatedClient = await pool.connect();
    
    // Add a listener to detect when this client has an error
    dedicatedClient.on('error', async (err) => {
      console.error('Dedicated client error:', err.message);
      dedicatedClient = null; // Force a new client on next operation
    });
    
    return dedicatedClient;
  } finally {
    isReconnecting = false;
  }
};

// Check if we should try to reconnect based on our last connection attempt
const shouldAttemptConnection = () => {
  // If we've never successfully connected, we should try
  if (!lastSuccessfulConnection) return true;
  
  // If we're currently attempting a connection and it's been less than 10 seconds, don't try again
  if (connectionAttemptTime && (new Date() - connectionAttemptTime) < 10000) {
    return false;
  }
  
  // Otherwise, try connecting
  return true;
};

// Execute a query with proper error handling
async function query(text, params = []) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log slow queries (over 200ms) for performance monitoring
    if (duration > 200) {
      console.log(`Slow query detected (${duration}ms): ${text.substring(0, 80)}...`);
    }
    
    return res;
  } catch (err) {
    console.error(`Error executing query: ${text.substring(0, 100)}...`);
    console.error(err.stack);
    throw err;
  }
}

// Fast-failing read-only query (for search operations)
async function queryReadOnly(text, params = [], defaultValue = []) {
  const client = await pool.connect();
  
  try {
    await client.query('SET statement_timeout TO 1000'); // 1 second timeout for search queries
    const res = await client.query(text, params);
    return res;
  } catch (err) {
    console.error(`Search query failed: ${err.message}`);
    return { rows: defaultValue };
  } finally {
    await client.query('SET statement_timeout TO DEFAULT');
    client.release();
  }
}

// Execute a transaction
async function withTransaction(callback) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Ping database to check connectivity
async function pingDatabase() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('🌐 PostgreSQL Connected Successfully!');
    return result.rows[0];
  } catch (err) {
    console.error('❌ PostgreSQL Connection Error:', err.message);
    throw new Error(`Database connection failed: ${err.message}`);
  }
}

// Handle initial connection with better diagnostic information
console.log('📊 Connecting to PostgreSQL...');
connectionAttemptTime = new Date();

pool.connect()
  .then(() => {
    lastSuccessfulConnection = new Date();
    console.log('🌐 PostgreSQL Connected Successfully!');
    console.log(`🕒 Connection established at: ${lastSuccessfulConnection.toISOString()}`);
    
    // Less frequent ping to reduce connection churn but enough to keep connections warm
    setInterval(async () => {
      const pingResult = await pingDatabase();
      if (pingResult.success) {
        // Connection is good, no need to log
      } else {
        console.warn(`⚠️ Ping failed at ${pingResult.timestamp}: ${pingResult.error}`);
      }
    }, 180000); // Ping every 3 minutes
  })
  .catch(err => {
    console.error('❌ PostgreSQL Connection Error: ', err.message);
    console.error('📌 Connection Details: Host=' + 
      (process.env.POSTGRES_URL ? process.env.POSTGRES_URL.split('@')[1]?.split('/')[0] : 'unknown'));
  });

// Export the improved database interface
module.exports = {
  query,
  queryReadOnly,
  pool,
  pingDatabase,
  withTransaction,
  getDedicatedClient
};
