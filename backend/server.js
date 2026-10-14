// server.js - Main HTTP server for AQMAS backend
// Uses Node.js built-in `http` and `url` modules only — NO Express
// Reads environment variables from .env via dotenv-free inline loader

'use strict';

// -------------------------------------------------------
// Minimal .env loader — avoids needing the `dotenv` package
// Reads key=value lines from .env in the same directory
// -------------------------------------------------------
const fs = require('fs');
const path = require('path');

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
    console.log('[Server] Loaded environment from .env');
} else {
    console.warn('[Server] No .env file found. Make sure environment variables are set.');
}

const http = require('http');
const { URL } = require('url');

const { testConnection } = require('./db');
const routes = require('./routes');

const PORT = parseInt(process.env.PORT || '5000', 10);

// -------------------------------------------------------
// CORS headers — allow the local Vite dev server (port 5173)
// and any localhost origin during development
// -------------------------------------------------------
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

// -------------------------------------------------------
// Helper: Send JSON response
// -------------------------------------------------------
function sendJSON(res, statusCode, data) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        ...CORS_HEADERS,
    });
    res.end(JSON.stringify(data));
}

// -------------------------------------------------------
// Main request dispatcher
// Parses URL, matches method + path, calls the right handler
// -------------------------------------------------------
async function handleRequest(req, res) {
    // Attach CORS headers to every response (including errors)
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));

    // Handle CORS preflight (OPTIONS) requests
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const baseURL = `http://localhost:${PORT}`;
    const parsedUrl = new URL(req.url, baseURL);
    const pathname = parsedUrl.pathname;
    const method = req.method.toUpperCase();

    console.log(`[Server] ${method} ${pathname}`);

    try {
        // ----- Air quality routes -----

        // GET /api/air-quality/history
        if (method === 'GET' && pathname === '/api/air-quality/history') {
            return await routes.getReadingHistory(req, res, parsedUrl);
        }

        // GET /api/air-quality
        if (method === 'GET' && pathname === '/api/air-quality') {
            return await routes.getLatestReading(req, res, parsedUrl);
        }

        // POST /api/air-quality
        if (method === 'POST' && pathname === '/api/air-quality') {
            return await routes.createReading(req, res);
        }

        // ----- Threshold routes -----

        // GET /api/thresholds
        if (method === 'GET' && pathname === '/api/thresholds') {
            return await routes.getThreshold(req, res, parsedUrl);
        }

        // POST /api/thresholds
        if (method === 'POST' && pathname === '/api/thresholds') {
            return await routes.saveThreshold(req, res);
        }

        // ----- Alert routes -----

        // GET /api/alerts
        if (method === 'GET' && pathname === '/api/alerts') {
            return await routes.getAlerts(req, res, parsedUrl);
        }

        // PATCH /api/alerts/:id/acknowledge
        // Example: PATCH /api/alerts/5/acknowledge
        const acknowledgeMatch = pathname.match(/^\/api\/alerts\/(\d+)\/acknowledge$/);
        if (method === 'PATCH' && acknowledgeMatch) {
            const alertId = acknowledgeMatch[1];
            return await routes.acknowledgeAlert(req, res, alertId);
        }

        // ----- Locations helper route -----

        // GET /api/locations
        if (method === 'GET' && pathname === '/api/locations') {
            return await routes.getLocations(req, res);
        }

        // ----- Health check -----

        // GET /api/health
        if (method === 'GET' && pathname === '/api/health') {
            return sendJSON(res, 200, { status: 'ok', timestamp: new Date().toISOString() });
        }

        // ----- 404 for everything else -----
        sendJSON(res, 404, { error: `Route not found: ${method} ${pathname}` });

    } catch (err) {
        // Catch any unhandled errors and return a safe 500
        console.error('[Server] Unhandled error:', err.message);
        sendJSON(res, 500, { error: 'An unexpected server error occurred.' });
    }
}

// -------------------------------------------------------
// Start server after confirming database connectivity
// -------------------------------------------------------
async function startServer() {
    // Test DB connection first — exit if it fails
    await testConnection();

    const server = http.createServer(handleRequest);

    server.listen(PORT, () => {
        console.log(`[Server] ✅ AQMAS backend running at http://localhost:${PORT}`);
        console.log(`[Server] Health check: http://localhost:${PORT}/api/health`);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`[Server] ❌ Port ${PORT} is already in use. Change PORT in .env.`);
        } else {
            console.error('[Server] Server error:', err.message);
        }
        process.exit(1);
    });
}

startServer();
