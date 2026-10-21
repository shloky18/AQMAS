// db.js - MySQL connection pool for AQMAS backend
// Uses mysql2 with promise-based API for cleaner async/await code

'use strict';

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Minimal inline .env loader in case db.js is imported independently of server.js
if (!process.env.DB_HOST && !process.env.DB_PASSWORD) {
    const envFile = path.join(__dirname, '.env');
    if (fs.existsSync(envFile)) {
        const lines = fs.readFileSync(envFile, 'utf8').split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const eqIdx = trimmed.indexOf('=');
            if (eqIdx === -1) continue;
            const key = trimmed.slice(0, eqIdx).trim();
            const value = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
            if (key && !(key in process.env)) {
                process.env[key] = value;
            }
        }
    }
}

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
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('[DB] MySQL connection pool established successfully.');
        connection.release();
    } catch (error) {
        console.error('[DB] ❌ Failed to connect to MySQL:', error.message);
        console.error('[DB] Check your .env file and ensure MySQL is running.');
        process.exit(1);
    }
}

module.exports = { pool, testConnection };
