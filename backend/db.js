// db.js - MySQL connection pool for AQMAS backend
// Uses mysql2 with promise-based API for cleaner async/await code

'use strict';

const mysql = require('mysql2/promise');

// Read database credentials from environment variables
// Always set these in .env - never hardcode passwords
const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               parseInt(process.env.DB_PORT || '3306', 10),
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'aqmas_db',
  waitForConnections: true,
  connectionLimit:    10,       // max simultaneous connections
  queueLimit:         0,        // unlimited queued requests
  timezone:           '+00:00', // store/retrieve timestamps in UTC
});

// Quick sanity-check: try to grab a connection at startup
// This helps catch wrong credentials early
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('[DB] MySQL connection pool established successfully.');
    connection.release();
  } catch (error) {
    console.error('[DB] ❌ Failed to connect to MySQL:', error.message);
    console.error('[DB] Check your .env file and ensure MySQL is running.');
    // Exit so the server does not start without a working database
    process.exit(1);
  }
}

module.exports = { pool, testConnection };
