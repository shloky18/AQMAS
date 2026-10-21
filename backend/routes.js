// routes.js - All REST API route handlers for AQMAS (Modules 3 & 5)
// Uses Node.js built-in modules only (no Express).
// Each handler receives (req, res, parsedUrl) from server.js

'use strict';

const { pool } = require('./db');
const { getHealthAdvice, dispatchNotification } = require('./notifications');

// -------------------------------------------------------
// Helper: Send a JSON response with CORS headers
// -------------------------------------------------------
function sendJSON(res, statusCode, data) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    });
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
                resolve(null);
            }
        });
    });
}

// -------------------------------------------------------
// Helper: Determine AQI severity category
// Based on standard AQI breakpoints
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
    if (value === null || value === undefined || value === '') return null;
    const num = allowDecimal ? parseFloat(value) : parseInt(value, 10);
    if (isNaN(num) || num < 0) return null;
    return num;
}

// =======================================================
// MODULE 3: AIR QUALITY & VISUALIZATION ROUTES
// =======================================================

// GET /api/air-quality?location=Mumbai
// Returns the latest reading with all monitored pollutants
async function getLatestReading(req, res, parsedUrl) {
    const location = parsedUrl.searchParams.get('location');
    if (!location) {
        return sendJSON(res, 400, { error: 'Query parameter "location" is required.' });
    }

    try {
        const [rows] = await pool.execute(
            `SELECT id, location, aqi, pm25, pm10, co, no2, so2, o3, severity, recorded_at
             FROM air_quality_readings
             WHERE location = ?
             ORDER BY recorded_at DESC
             LIMIT 1`,
            [location.trim()]
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

// GET /api/air-quality/history?location=Mumbai&range=day|week|month
// Supports Day, Week, and Month filters (Module 3 requirement)
async function getReadingHistory(req, res, parsedUrl) {
    const location = parsedUrl.searchParams.get('location');
    const range = (parsedUrl.searchParams.get('range') || '').toLowerCase().trim();

    if (!location) {
        return sendJSON(res, 400, { error: 'Query parameter "location" is required.' });
    }

    try {
        let query = '';
        let params = [location.trim()];

        if (range === 'day') {
            // Last 24 hours
            query = `SELECT id, location, aqi, pm25, pm10, co, no2, so2, o3, severity, recorded_at
                     FROM air_quality_readings
                     WHERE location = ? AND recorded_at >= NOW() - INTERVAL 24 HOUR
                     ORDER BY recorded_at DESC`;
        } else if (range === 'week') {
            // Last 7 days
            query = `SELECT id, location, aqi, pm25, pm10, co, no2, so2, o3, severity, recorded_at
                     FROM air_quality_readings
                     WHERE location = ? AND recorded_at >= NOW() - INTERVAL 7 DAY
                     ORDER BY recorded_at DESC`;
        } else if (range === 'month') {
            // Last 30 days
            query = `SELECT id, location, aqi, pm25, pm10, co, no2, so2, o3, severity, recorded_at
                     FROM air_quality_readings
                     WHERE location = ? AND recorded_at >= NOW() - INTERVAL 30 DAY
                     ORDER BY recorded_at DESC`;
        } else {
            // Default backwards-compatible: latest 20 readings
            query = `SELECT id, location, aqi, pm25, pm10, co, no2, so2, o3, severity, recorded_at
                     FROM air_quality_readings
                     WHERE location = ?
                     ORDER BY recorded_at DESC
                     LIMIT 20`;
        }

        const [rows] = await pool.execute(query, params);
        sendJSON(res, 200, rows);
    } catch (err) {
        console.error('[Route] getReadingHistory error:', err.message);
        sendJSON(res, 500, { error: 'Database error while fetching history.' });
    }
}

// GET /api/air-quality/compare?locations=Mumbai,Delhi,Pune&range=day|week|month
// Supports comparing up to three locations (Module 3 requirement)
async function getCompareReadings(req, res, parsedUrl) {
    const locParam = parsedUrl.searchParams.get('locations');
    const range = (parsedUrl.searchParams.get('range') || 'week').toLowerCase().trim();

    if (!locParam) {
        return sendJSON(res, 400, { error: 'Query parameter "locations" is required (comma-separated, max 3).' });
    }

    const locations = locParam.split(',')
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(0, 3); // Max 3 locations per SRS

    if (locations.length === 0) {
        return sendJSON(res, 400, { error: 'At least one valid location must be specified.' });
    }

    try {
        const results = {};

        for (const loc of locations) {
            // 1. Latest reading
            const [latestRows] = await pool.execute(
                `SELECT id, location, aqi, pm25, pm10, co, no2, so2, o3, severity, recorded_at
                 FROM air_quality_readings
                 WHERE location = ?
                 ORDER BY recorded_at DESC
                 LIMIT 1`,
                [loc]
            );

            // 2. History by range
            let historyQuery = '';
            if (range === 'day') {
                historyQuery = `SELECT id, location, aqi, severity, recorded_at
                                FROM air_quality_readings
                                WHERE location = ? AND recorded_at >= NOW() - INTERVAL 24 HOUR
                                ORDER BY recorded_at ASC`;
            } else if (range === 'month') {
                historyQuery = `SELECT id, location, aqi, severity, recorded_at
                                FROM air_quality_readings
                                WHERE location = ? AND recorded_at >= NOW() - INTERVAL 30 DAY
                                ORDER BY recorded_at ASC`;
            } else {
                historyQuery = `SELECT id, location, aqi, severity, recorded_at
                                FROM air_quality_readings
                                WHERE location = ? AND recorded_at >= NOW() - INTERVAL 7 DAY
                                ORDER BY recorded_at ASC`;
            }

            const [historyRows] = await pool.execute(historyQuery, [loc]);

            results[loc] = {
                latest: latestRows[0] || null,
                history: historyRows,
            };
        }

        sendJSON(res, 200, { locations, range, data: results });
    } catch (err) {
        console.error('[Route] getCompareReadings error:', err.message);
        sendJSON(res, 500, { error: 'Database error while comparing locations.' });
    }
}

// POST /api/air-quality
// Body: { location, aqi, pm25, pm10, co?, no2?, so2?, o3?, recorded_at? }
// Saves reading, evaluates threshold breach with 3-hour cooldown, and detects sudden spikes (>100 in <3h)
async function createReading(req, res) {
    const body = await parseBody(req, res);
    if (body === null) return;

    const { location, aqi, pm25, pm10, co, no2, so2, o3, recorded_at } = body;

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

    // Optional pollutants (Module 3)
    const parsedCo  = parsePositiveNumber(co, true);
    const parsedNo2 = parsePositiveNumber(no2, true);
    const parsedSo2 = parsePositiveNumber(so2, true);
    const parsedO3  = parsePositiveNumber(o3, true);

    const severity = getSeverity(parsedAqi);
    const cleanedLocation = location.trim();

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Insert reading (support explicit timestamp if provided for test scenarios)
        let insertSql = `INSERT INTO air_quality_readings
                         (location, aqi, pm25, pm10, co, no2, so2, o3, severity, recorded_at)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        let insertTime = recorded_at ? new Date(recorded_at) : new Date();
        if (isNaN(insertTime.getTime())) insertTime = new Date();

        const [insertResult] = await conn.execute(insertSql, [
            cleanedLocation,
            parsedAqi,
            parsedPm25,
            parsedPm10,
            parsedCo,
            parsedNo2,
            parsedSo2,
            parsedO3,
            severity,
            insertTime,
        ]);
        const readingId = insertResult.insertId;

        const [readingRows] = await conn.execute(
            'SELECT * FROM air_quality_readings WHERE id = ?',
            [readingId]
        );
        const savedReading = readingRows[0];

        // 2. Fetch threshold for this location (or fallback to default 100)
        const [thresholdRows] = await conn.execute(
            'SELECT * FROM aqi_thresholds WHERE location = ?',
            [cleanedLocation]
        );

        const thresholdConfig = thresholdRows.length > 0
            ? thresholdRows[0]
            : { location: cleanedLocation, threshold_value: 100, enabled: 1 };

        let thresholdAlertCreated = false;
        let thresholdAlertRecord = null;
        let duplicateSuppressed = false;

        // ----------------------------------------------------
        // MODULE 5: THRESHOLD BREACH & 3-HOUR COOLDOWN CHECK
        // ----------------------------------------------------
        if (thresholdConfig.enabled && parsedAqi > thresholdConfig.threshold_value) {
            // Check if an alert for threshold breach was created for this location within the 3-hour cooldown window
            const [recentThresholdAlerts] = await conn.execute(
                `SELECT id, created_at, aqi
                 FROM alerts
                 WHERE location = ?
                   AND alert_type = 'threshold_breach'
                   AND created_at >= ? - INTERVAL 3 HOUR
                 ORDER BY created_at DESC
                 LIMIT 1`,
                [cleanedLocation, insertTime]
            );

            if (recentThresholdAlerts.length > 0) {
                // Cooldown active: Do not generate duplicate alert
                duplicateSuppressed = true;
                console.log(`[Alert Cooldown] ⚠️ Threshold breach detected (AQI ${parsedAqi} > ${thresholdConfig.threshold_value}) but suppressed by 3-hour cooldown for ${cleanedLocation}. Last alert was at ${recentThresholdAlerts[0].created_at}.`);
            } else {
                // Legitimate new breach or cooldown elapsed: Create alert
                const msg = `ALERT: AQI of ${parsedAqi} in ${cleanedLocation} has exceeded the configured threshold of ${thresholdConfig.threshold_value}. Immediate attention recommended.`;
                const advice = getHealthAdvice(parsedAqi, 'threshold_breach');

                const [alertInsert] = await conn.execute(
                    `INSERT INTO alerts
                     (reading_id, location, aqi, threshold_value, severity, alert_type, message, health_advice, created_at, status)
                     VALUES (?, ?, ?, ?, ?, 'threshold_breach', ?, ?, ?, 'active')`,
                    [
                        readingId,
                        cleanedLocation,
                        parsedAqi,
                        thresholdConfig.threshold_value,
                        severity,
                        msg,
                        advice,
                        insertTime,
                    ]
                );

                const [alertRows] = await conn.execute(
                    'SELECT * FROM alerts WHERE id = ?',
                    [alertInsert.insertId]
                );

                thresholdAlertCreated = true;
                thresholdAlertRecord = alertRows[0];
                await dispatchNotification(thresholdAlertRecord);
            }
        }

        // ----------------------------------------------------
        // MODULE 5: SUDDEN AQI SPIKE DETECTION (>100 in <3h)
        // ----------------------------------------------------
        let spikeAlertCreated = false;
        let spikeAlertRecord = null;

        // Find minimum AQI reading from the same location within the preceding 3 hours
        const [priorReadings] = await conn.execute(
            `SELECT id, aqi, recorded_at
             FROM air_quality_readings
             WHERE location = ?
               AND id != ?
               AND recorded_at >= ? - INTERVAL 3 HOUR
               AND recorded_at <= ?
             ORDER BY aqi ASC
             LIMIT 1`,
            [cleanedLocation, readingId, insertTime, insertTime]
        );

        if (priorReadings.length > 0) {
            const minPriorAqi = priorReadings[0].aqi;
            const aqiJump = parsedAqi - minPriorAqi;

            if (aqiJump > 100) {
                // Check if a spike alert was already generated for this location in the last 3 hours to avoid repeats
                const [recentSpikeAlerts] = await conn.execute(
                    `SELECT id FROM alerts
                     WHERE location = ?
                       AND alert_type = 'spike'
                       AND created_at >= ? - INTERVAL 3 HOUR
                     LIMIT 1`,
                    [cleanedLocation, insertTime]
                );

                if (recentSpikeAlerts.length === 0) {
                    const spikeMsg = `SPIKE ALERT: Sudden AQI surge of +${aqiJump} points (from ${minPriorAqi} to ${parsedAqi}) detected within 3 hours in ${cleanedLocation}. Rapid air degradation in progress.`;
                    const spikeAdvice = getHealthAdvice(parsedAqi, 'spike', { jump: aqiJump });

                    const [spikeInsert] = await conn.execute(
                        `INSERT INTO alerts
                         (reading_id, location, aqi, threshold_value, severity, alert_type, message, health_advice, created_at, status)
                         VALUES (?, ?, ?, ?, 'Hazardous', 'spike', ?, ?, ?, 'active')`,
                        [
                            readingId,
                            cleanedLocation,
                            parsedAqi,
                            thresholdConfig.threshold_value,
                            spikeMsg,
                            spikeAdvice,
                            insertTime,
                        ]
                    );

                    const [spikeRows] = await conn.execute(
                        'SELECT * FROM alerts WHERE id = ?',
                        [spikeInsert.insertId]
                    );

                    spikeAlertCreated = true;
                    spikeAlertRecord = spikeRows[0];
                    await dispatchNotification(spikeAlertRecord);
                }
            }
        }

        await conn.commit();

        const alertGenerated = thresholdAlertCreated || spikeAlertCreated;
        let messageText = 'Reading saved.';
        if (spikeAlertCreated && thresholdAlertCreated) {
            messageText = 'Reading saved. Threshold breach alert and Sudden Spike alert generated!';
        } else if (spikeAlertCreated) {
            messageText = 'Reading saved. Sudden AQI Spike alert generated!';
        } else if (thresholdAlertCreated) {
            messageText = 'Reading saved and alert generated.';
        } else if (duplicateSuppressed) {
            messageText = 'Reading saved. Alert suppressed due to active 3-hour cooldown.';
        } else {
            messageText = 'Reading saved. No alert generated.';
        }

        sendJSON(res, 201, {
            message: messageText,
            reading: savedReading,
            alertGenerated,
            duplicateSuppressed,
            alert: thresholdAlertRecord || spikeAlertRecord || null,
            thresholdAlert: thresholdAlertRecord,
            spikeAlert: spikeAlertRecord,
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
// MODULE 5: THRESHOLD & ALERT ROUTES (SINGLE USER)
// =======================================================

// GET /api/thresholds?location=Mumbai
async function getThreshold(req, res, parsedUrl) {
    const location = parsedUrl.searchParams.get('location');
    if (!location) {
        // Return default configuration or all thresholds
        try {
            const [rows] = await pool.execute('SELECT * FROM aqi_thresholds ORDER BY location ASC');
            return sendJSON(res, 200, rows);
        } catch (err) {
            return sendJSON(res, 500, { error: 'Database error while fetching thresholds.' });
        }
    }

    try {
        const [rows] = await pool.execute(
            'SELECT * FROM aqi_thresholds WHERE location = ?',
            [location.trim()]
        );

        if (rows.length === 0) {
            return sendJSON(res, 200, {
                location: location.trim(),
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
    const isEnabled = (enabled === true || enabled === 1 || enabled === '1') ? 1 : 0;

    try {
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

// GET /api/alerts?location=Mumbai&status=active|acknowledged
// Returns alerts with full Module 5 metadata
async function getAlerts(req, res, parsedUrl) {
    const location = parsedUrl.searchParams.get('location');
    const status = parsedUrl.searchParams.get('status');

    try {
        let query = `SELECT id, reading_id, location, aqi, threshold_value, severity, alert_type,
                            message, health_advice, created_at, status, acknowledged_at
                     FROM alerts`;
        const conditions = [];
        const params = [];

        if (location && location.toLowerCase() !== 'all') {
            conditions.push('location = ?');
            params.push(location.trim());
        }

        if (status && (status === 'active' || status === 'acknowledged')) {
            conditions.push('status = ?');
            params.push(status);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY created_at DESC LIMIT 50';

        const [rows] = await pool.execute(query, params);
        sendJSON(res, 200, rows);
    } catch (err) {
        console.error('[Route] getAlerts error:', err.message);
        sendJSON(res, 500, { error: 'Database error while fetching alerts.' });
    }
}

// PATCH /api/alerts/:id/acknowledge
// Marks an alert as acknowledged and records timestamp
async function acknowledgeAlert(req, res, alertId) {
    const id = parseInt(alertId, 10);
    if (isNaN(id) || id <= 0) {
        return sendJSON(res, 400, { error: 'Invalid alert ID.' });
    }

    try {
        const [result] = await pool.execute(
            `UPDATE alerts
             SET status = 'acknowledged', acknowledged_at = NOW()
             WHERE id = ? AND status = 'active'`,
            [id]
        );

        if (result.affectedRows === 0) {
            const [check] = await pool.execute('SELECT * FROM alerts WHERE id = ?', [id]);
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

// GET /api/disaster-alerts?location=Mumbai
// Support disaster-linked pollution alerts (Module 5 requirement)
async function getDisasterAlerts(req, res, parsedUrl) {
    const location = parsedUrl.searchParams.get('location');

    try {
        let query = `SELECT id, event_type, affected_area, aqi, priority, safety_advice, source, is_active, created_at
                     FROM disaster_alerts
                     WHERE is_active = 1`;
        const params = [];

        if (location && location.toLowerCase() !== 'all') {
            query += ' AND affected_area = ?';
            params.push(location.trim());
        }

        query += ' ORDER BY created_at DESC LIMIT 20';

        const [rows] = await pool.execute(query, params);
        sendJSON(res, 200, {
            source: 'Demonstration Fixture (No external paid API required)',
            disasterAlerts: rows,
        });
    } catch (err) {
        console.error('[Route] getDisasterAlerts error:', err.message);
        sendJSON(res, 500, { error: 'Database error while fetching disaster alerts.' });
    }
}

// GET /api/locations
// Returns distinct known locations
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
    getCompareReadings,
    createReading,
    getThreshold,
    saveThreshold,
    getAlerts,
    acknowledgeAlert,
    getDisasterAlerts,
    getLocations,
};
