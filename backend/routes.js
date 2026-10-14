// routes.js - All REST API route handlers for AQMAS
// Uses Node.js built-in modules only (no Express).
// Each handler receives (req, res, parsedUrl) from server.js

'use strict';

const { pool } = require('./db');

// -------------------------------------------------------
// Helper: Send a JSON response
// -------------------------------------------------------
function sendJSON(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

// -------------------------------------------------------
// Helper: Read the entire request body as a JSON object
// Returns null and sends 400 if JSON is invalid
// -------------------------------------------------------
function parseBody(req, res) {
    return new Promise((resolve) => {
        let raw = '';
        req.on('data', (chunk) => { raw += chunk.toString(); });
        req.on('end', () => {
            if (!raw) {
                resolve({});
                return;
            }
            try {
                resolve(JSON.parse(raw));
            } catch {
                sendJSON(res, 400, { error: 'Invalid JSON in request body.' });
                resolve(null);   // null signals caller to abort
            }
        });
    });
}

// -------------------------------------------------------
// Helper: Determine AQI severity category
// Based on standard AQI breakpoints (simplified for demo)
// -------------------------------------------------------
function getSeverity(aqi) {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
}

// -------------------------------------------------------
// Helper: Validate a numeric field
// Returns parsed number or null if invalid / negative
// -------------------------------------------------------
function parsePositiveNumber(value, allowDecimal = true) {
    const num = allowDecimal ? parseFloat(value) : parseInt(value, 10);
    if (isNaN(num) || num < 0) return null;
    return num;
}

// =======================================================
// AIR QUALITY ROUTES
// =======================================================

// GET /api/air-quality?location=Mumbai
// Returns the latest reading for the given location
async function getLatestReading(req, res, parsedUrl) {
    const location = parsedUrl.searchParams.get('location');
    if (!location) {
        return sendJSON(res, 400, { error: 'Query parameter "location" is required.' });
    }

    try {
        const [rows] = await pool.execute(
            `SELECT * FROM air_quality_readings
       WHERE location = ?
       ORDER BY recorded_at DESC
       LIMIT 1`,
            [location]
        );

        if (rows.length === 0) {
            return sendJSON(res, 404, { error: `No readings found for location: ${location}` });
        }
        sendJSON(res, 200, rows[0]);
    } catch (err) {
        console.error('[Route] getLatestReading error:', err.message);
        sendJSON(res, 500, { error: 'Database error while fetching reading.' });
    }
}

// GET /api/air-quality/history?location=Mumbai
// Returns up to 20 recent readings for the given location
async function getReadingHistory(req, res, parsedUrl) {
    const location = parsedUrl.searchParams.get('location');
    if (!location) {
        return sendJSON(res, 400, { error: 'Query parameter "location" is required.' });
    }

    try {
        const [rows] = await pool.execute(
            `SELECT * FROM air_quality_readings
       WHERE location = ?
       ORDER BY recorded_at DESC
       LIMIT 20`,
            [location]
        );
        sendJSON(res, 200, rows);
    } catch (err) {
        console.error('[Route] getReadingHistory error:', err.message);
        sendJSON(res, 500, { error: 'Database error while fetching history.' });
    }
}

// POST /api/air-quality
// Body: { location, aqi, pm25, pm10 }
// Saves reading, checks threshold, generates alert if needed
async function createReading(req, res) {
    const body = await parseBody(req, res);
    if (body === null) return;   // parseBody already sent 400

    const { location, aqi, pm25, pm10 } = body;

    // ----- Input validation -----
    if (!location || typeof location !== 'string' || !location.trim()) {
        return sendJSON(res, 400, { error: '"location" is required and must be a non-empty string.' });
    }

    const parsedAqi = parsePositiveNumber(aqi, false);
    const parsedPm25 = parsePositiveNumber(pm25, true);
    const parsedPm10 = parsePositiveNumber(pm10, true);

    if (parsedAqi === null) return sendJSON(res, 400, { error: '"aqi" must be a non-negative integer.' });
    if (parsedPm25 === null) return sendJSON(res, 400, { error: '"pm25" must be a non-negative number.' });
    if (parsedPm10 === null) return sendJSON(res, 400, { error: '"pm10" must be a non-negative number.' });

    const severity = getSeverity(parsedAqi);
    const cleanedLocation = location.trim();

    // Use a transaction so the reading and alert are saved atomically
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Insert the new reading
        const [insertResult] = await conn.execute(
            `INSERT INTO air_quality_readings (location, aqi, pm25, pm10, severity)
       VALUES (?, ?, ?, ?, ?)`,
            [cleanedLocation, parsedAqi, parsedPm25, parsedPm10, severity]
        );
        const readingId = insertResult.insertId;

        // 2. Fetch the saved reading back (to get the auto-generated recorded_at)
        const [readingRows] = await conn.execute(
            'SELECT * FROM air_quality_readings WHERE id = ?',
            [readingId]
        );
        const savedReading = readingRows[0];

        // 3. Check threshold for this location
        const [thresholdRows] = await conn.execute(
            'SELECT * FROM aqi_thresholds WHERE location = ?',
            [cleanedLocation]
        );

        let alertGenerated = false;
        let alertRecord = null;

        if (thresholdRows.length > 0) {
            const config = thresholdRows[0];
            // Generate alert only if monitoring is enabled AND AQI exceeds threshold
            if (config.enabled && parsedAqi > config.threshold_value) {
                const message = `ALERT: AQI of ${parsedAqi} in ${cleanedLocation} has exceeded the configured threshold of ${config.threshold_value}. Immediate attention recommended.`;

                const [alertInsert] = await conn.execute(
                    `INSERT INTO alerts (reading_id, location, aqi, message, status)
           VALUES (?, ?, ?, ?, 'active')`,
                    [readingId, cleanedLocation, parsedAqi, message]
                );

                const [alertRows] = await conn.execute(
                    'SELECT * FROM alerts WHERE id = ?',
                    [alertInsert.insertId]
                );

                alertGenerated = true;
                alertRecord = alertRows[0];
            }
        }

        await conn.commit();

        sendJSON(res, 201, {
            message: alertGenerated
                ? 'Reading saved and alert generated.'
                : 'Reading saved. No alert generated.',
            reading: savedReading,
            alertGenerated,
            alert: alertRecord || null,
        });

    } catch (err) {
        await conn.rollback();
        console.error('[Route] createReading error:', err.message);
        sendJSON(res, 500, { error: 'Database error while saving reading.' });
    } finally {
        conn.release();
    }
}

// =======================================================
// THRESHOLD ROUTES
// =======================================================

// GET /api/thresholds?location=Mumbai
async function getThreshold(req, res, parsedUrl) {
    const location = parsedUrl.searchParams.get('location');
    if (!location) {
        return sendJSON(res, 400, { error: 'Query parameter "location" is required.' });
    }

    try {
        const [rows] = await pool.execute(
            'SELECT * FROM aqi_thresholds WHERE location = ?',
            [location]
        );

        if (rows.length === 0) {
            // Return a default config if none exists yet
            return sendJSON(res, 200, {
                location,
                threshold_value: 100,
                enabled: true,
                exists: false,
            });
        }
        sendJSON(res, 200, { ...rows[0], exists: true });
    } catch (err) {
        console.error('[Route] getThreshold error:', err.message);
        sendJSON(res, 500, { error: 'Database error while fetching threshold.' });
    }
}

// POST /api/thresholds
// Body: { location, threshold_value, enabled }
// Inserts or updates the threshold for a location (upsert)
async function saveThreshold(req, res) {
    const body = await parseBody(req, res);
    if (body === null) return;

    const { location, threshold_value, enabled } = body;

    if (!location || typeof location !== 'string' || !location.trim()) {
        return sendJSON(res, 400, { error: '"location" is required.' });
    }
    const parsedThreshold = parsePositiveNumber(threshold_value, false);
    if (parsedThreshold === null) {
        return sendJSON(res, 400, { error: '"threshold_value" must be a non-negative integer.' });
    }
    // enabled can be boolean or 0/1
    const isEnabled = (enabled === true || enabled === 1 || enabled === '1') ? 1 : 0;

    try {
        // ON DUPLICATE KEY UPDATE handles the upsert for the unique location column
        await pool.execute(
            `INSERT INTO aqi_thresholds (location, threshold_value, enabled)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         threshold_value = VALUES(threshold_value),
         enabled         = VALUES(enabled)`,
            [location.trim(), parsedThreshold, isEnabled]
        );

        const [rows] = await pool.execute(
            'SELECT * FROM aqi_thresholds WHERE location = ?',
            [location.trim()]
        );
        sendJSON(res, 200, {
            message: 'Threshold saved successfully.',
            threshold: rows[0],
        });
    } catch (err) {
        console.error('[Route] saveThreshold error:', err.message);
        sendJSON(res, 500, { error: 'Database error while saving threshold.' });
    }
}

// =======================================================
// ALERT ROUTES
// =======================================================

// GET /api/alerts?location=Mumbai
async function getAlerts(req, res, parsedUrl) {
    const location = parsedUrl.searchParams.get('location');
    if (!location) {
        return sendJSON(res, 400, { error: 'Query parameter "location" is required.' });
    }

    try {
        const [rows] = await pool.execute(
            `SELECT * FROM alerts
       WHERE location = ?
       ORDER BY created_at DESC
       LIMIT 50`,
            [location]
        );
        sendJSON(res, 200, rows);
    } catch (err) {
        console.error('[Route] getAlerts error:', err.message);
        sendJSON(res, 500, { error: 'Database error while fetching alerts.' });
    }
}

// PATCH /api/alerts/:id/acknowledge
// Marks an alert as acknowledged
async function acknowledgeAlert(req, res, alertId) {
    const id = parseInt(alertId, 10);
    if (isNaN(id) || id <= 0) {
        return sendJSON(res, 400, { error: 'Invalid alert ID.' });
    }

    try {
        const [result] = await pool.execute(
            `UPDATE alerts SET status = 'acknowledged' WHERE id = ? AND status = 'active'`,
            [id]
        );

        if (result.affectedRows === 0) {
            // Either not found, or already acknowledged
            const [check] = await pool.execute('SELECT id, status FROM alerts WHERE id = ?', [id]);
            if (check.length === 0) {
                return sendJSON(res, 404, { error: `Alert with ID ${id} not found.` });
            }
            return sendJSON(res, 200, { message: 'Alert is already acknowledged.', alert: check[0] });
        }

        const [rows] = await pool.execute('SELECT * FROM alerts WHERE id = ?', [id]);
        sendJSON(res, 200, { message: 'Alert acknowledged successfully.', alert: rows[0] });
    } catch (err) {
        console.error('[Route] acknowledgeAlert error:', err.message);
        sendJSON(res, 500, { error: 'Database error while acknowledging alert.' });
    }
}

// GET /api/locations
// Returns the list of distinct known locations
async function getLocations(req, res) {
    try {
        const [rows] = await pool.execute(
            `SELECT DISTINCT location FROM air_quality_readings ORDER BY location ASC`
        );
        const locations = rows.map((r) => r.location);
        sendJSON(res, 200, locations);
    } catch (err) {
        console.error('[Route] getLocations error:', err.message);
        sendJSON(res, 500, { error: 'Database error while fetching locations.' });
    }
}

module.exports = {
    getLatestReading,
    getReadingHistory,
    createReading,
    getThreshold,
    saveThreshold,
    getAlerts,
    acknowledgeAlert,
    getLocations,
};
