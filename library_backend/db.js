// db.js
const { Pool } = require('pg');
require('dotenv').config();  // <-- load .env

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

pool.connect()
  .then(() => console.log('🌐 PostgreSQL Connected Successfully!'))
  .catch(err => console.error('❌ PostgreSQL Connection Error: ', err));

module.exports = pool;
