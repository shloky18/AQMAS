-- AQMAS - Air Quality Alert Generation System
-- seed.sql: inserts sample data for demonstration
-- Run AFTER schema.sql

USE aqmas_db;

-- -------------------------------------------------------
-- Sample air quality readings (historical data)
-- Note: These are simulated readings for demonstration only
--       and are NOT live measurements.
-- Pollutants: PM2.5, PM10, CO, NO2, SO2, O3
-- (Some readings have all pollutants, others have subset to demonstrate clear N/A handling)
-- -------------------------------------------------------

-- Mumbai readings (past 7 days)
INSERT INTO air_quality_readings (location, aqi, pm25, pm10, co, no2, so2, o3, severity, recorded_at) VALUES
('Mumbai', 162, 68.5,  120.3, 1.45, 42.1, 14.8, 32.5, 'Unhealthy',             NOW() - INTERVAL 1  HOUR),
('Mumbai', 145, 61.2,  110.8, 1.20, 38.5, 12.0, 29.0, 'Unhealthy',             NOW() - INTERVAL 4  HOUR),
('Mumbai', 118, 49.0,   95.5, 0.95, 31.0, 10.2, 25.4, 'Unhealthy for Sensitive Groups', NOW() - INTERVAL 8  HOUR),
('Mumbai', 95,  39.1,   80.2, 0.80, 26.4, NULL, NULL,  'Moderate',              NOW() - INTERVAL 12 HOUR),
('Mumbai', 78,  30.5,   65.4, 0.65, 21.0, NULL, NULL,  'Moderate',              NOW() - INTERVAL 1  DAY),
('Mumbai', 60,  22.8,   50.1, 0.50, 18.2,  6.5, 19.8,  'Moderate',              NOW() - INTERVAL 2  DAY),
('Mumbai', 45,  15.2,   38.7, 0.38, 14.0,  5.0, 16.2,  'Good',                  NOW() - INTERVAL 3  DAY),
('Mumbai', 110, 45.0,   90.0, 0.90, 30.5,  9.5, 24.0,  'Unhealthy for Sensitive Groups', NOW() - INTERVAL 4  DAY),
('Mumbai', 135, 56.0,  105.0, 1.10, 36.0, 11.0, 27.5,  'Unhealthy',             NOW() - INTERVAL 5  DAY),
('Mumbai', 88,  35.5,   72.0, 0.72, 24.0,  7.8, 22.0,  'Moderate',              NOW() - INTERVAL 6  DAY);

-- Delhi readings
INSERT INTO air_quality_readings (location, aqi, pm25, pm10, co, no2, so2, o3, severity, recorded_at) VALUES
('Delhi', 210, 95.0,  185.5, 2.30, 68.0, 22.5, 45.0, 'Very Unhealthy',         NOW() - INTERVAL 1  HOUR),
('Delhi', 198, 88.3,  172.0, 2.10, 62.4, 20.0, 41.2, 'Very Unhealthy',         NOW() - INTERVAL 4  HOUR),
('Delhi', 175, 75.0,  150.2, 1.85, 55.0, 18.2, 38.0, 'Unhealthy',              NOW() - INTERVAL 8  HOUR),
('Delhi', 160, 68.0,  135.5, 1.60, 49.5, 16.0, 34.5, 'Unhealthy',              NOW() - INTERVAL 12 HOUR),
('Delhi', 142, 59.5,  118.0, 1.35, 42.0, NULL, NULL,  'Unhealthy',              NOW() - INTERVAL 1  DAY),
('Delhi', 120, 50.0,   98.0, 1.10, 36.5, NULL, NULL,  'Unhealthy for Sensitive Groups', NOW() - INTERVAL 2  DAY),
('Delhi', 95,  39.0,   80.0, 0.85, 28.0,  9.0, 23.0,  'Moderate',               NOW() - INTERVAL 3  DAY),
('Delhi', 185, 80.0,  160.0, 1.95, 58.0, 19.0, 39.0, 'Unhealthy',              NOW() - INTERVAL 4  DAY),
('Delhi', 220, 100.5, 195.0, 2.45, 72.0, 24.0, 48.0, 'Very Unhealthy',         NOW() - INTERVAL 5  DAY),
('Delhi', 155, 64.0,  128.0, 1.50, 46.0, 15.0, 32.0, 'Unhealthy',              NOW() - INTERVAL 6  DAY);

-- Pune readings
INSERT INTO air_quality_readings (location, aqi, pm25, pm10, co, no2, so2, o3, severity, recorded_at) VALUES
('Pune', 75,  28.5,  60.3, 0.62, 19.5,  6.8, 20.1, 'Moderate',                 NOW() - INTERVAL 1  HOUR),
('Pune', 82,  32.1,  65.8, 0.70, 22.0,  7.4, 22.5, 'Moderate',                 NOW() - INTERVAL 4  HOUR),
('Pune', 65,  23.0,  52.5, 0.54, 16.8,  5.8, 18.0, 'Moderate',                 NOW() - INTERVAL 8  HOUR),
('Pune', 48,  16.2,  40.0, 0.40, 12.5, NULL, NULL,  'Good',                     NOW() - INTERVAL 12 HOUR),
('Pune', 38,  12.5,  32.0, 0.32, 10.0, NULL, NULL,  'Good',                     NOW() - INTERVAL 1  DAY),
('Pune', 55,  19.8,  46.5, 0.45, 14.2,  5.0, 15.5, 'Moderate',                 NOW() - INTERVAL 2  DAY),
('Pune', 42,  14.0,  35.8, 0.35, 11.0,  4.2, 13.0, 'Good',                     NOW() - INTERVAL 3  DAY),
('Pune', 88,  35.0,  71.0, 0.75, 24.5,  8.0, 24.0, 'Moderate',                 NOW() - INTERVAL 4  DAY),
('Pune', 105, 43.0,  88.0, 0.90, 29.0,  9.5, 26.5, 'Unhealthy for Sensitive Groups', NOW() - INTERVAL 5  DAY),
('Pune', 70,  26.0,  57.0, 0.58, 18.0,  6.2, 19.0, 'Moderate',                 NOW() - INTERVAL 6  DAY);

-- Bangalore readings
INSERT INTO air_quality_readings (location, aqi, pm25, pm10, co, no2, so2, o3, severity, recorded_at) VALUES
('Bangalore', 52, 18.0, 44.0, 0.45, 14.0,  5.0, 17.5, 'Good',                  NOW() - INTERVAL 1  HOUR),
('Bangalore', 60, 21.5, 50.5, 0.52, 16.5,  5.8, 19.0, 'Moderate',              NOW() - INTERVAL 4  HOUR),
('Bangalore', 45, 15.0, 38.5, 0.38, 12.0,  4.5, 15.0, 'Good',                  NOW() - INTERVAL 8  HOUR),
('Bangalore', 70, 26.0, 57.5, 0.60, 18.5, NULL, NULL,  'Moderate',              NOW() - INTERVAL 12 HOUR),
('Bangalore', 35, 11.0, 28.0, 0.30,  9.0, NULL, NULL,  'Good',                  NOW() - INTERVAL 1  DAY),
('Bangalore', 48, 16.5, 41.0, 0.40, 13.0,  4.8, 16.0, 'Good',                  NOW() - INTERVAL 2  DAY),
('Bangalore', 78, 30.0, 63.0, 0.68, 21.0,  7.0, 21.5, 'Moderate',              NOW() - INTERVAL 3  DAY),
('Bangalore', 92, 38.0, 77.0, 0.80, 25.5,  8.5, 25.0, 'Moderate',              NOW() - INTERVAL 4  DAY),
('Bangalore', 55, 19.5, 46.0, 0.48, 15.0,  5.2, 18.0, 'Moderate',              NOW() - INTERVAL 5  DAY),
('Bangalore', 40, 13.5, 32.5, 0.34, 10.5,  4.0, 14.0, 'Good',                  NOW() - INTERVAL 6  DAY);

-- -------------------------------------------------------
-- Default AQI thresholds (one per location, single-user application default)
-- -------------------------------------------------------
INSERT INTO aqi_thresholds (location, threshold_value, enabled) VALUES
('Mumbai',    100, 1),
('Delhi',     150, 1),
('Pune',      100, 1),
('Bangalore',  80, 1)
ON DUPLICATE KEY UPDATE threshold_value = VALUES(threshold_value), enabled = VALUES(enabled);

-- -------------------------------------------------------
-- Sample alerts with full Module 5 metadata
-- -------------------------------------------------------
INSERT INTO alerts (reading_id, location, aqi, threshold_value, severity, alert_type, message, health_advice, created_at, status)
SELECT
    id,
    location,
    aqi,
    100,
    'Unhealthy',
    'threshold_breach',
    CONCAT('ALERT: AQI of ', aqi, ' in ', location, ' has exceeded the configured threshold of 100.'),
    'Everyone should reduce heavy outdoor exertion. Keep windows closed and consider wearing an N95 mask.',
    recorded_at,
    'active'
FROM air_quality_readings
WHERE location = 'Mumbai' AND aqi > 100
  AND recorded_at >= NOW() - INTERVAL 2 DAY
LIMIT 1;

INSERT INTO alerts (reading_id, location, aqi, threshold_value, severity, alert_type, message, health_advice, created_at, status, acknowledged_at)
SELECT
    id,
    location,
    aqi,
    150,
    'Very Unhealthy',
    'threshold_breach',
    CONCAT('ALERT: AQI of ', aqi, ' in ', location, ' has exceeded the configured threshold of 150.'),
    'Health alert: Serious risk of respiratory irritation. Avoid all strenuous outdoor activities.',
    recorded_at,
    'acknowledged',
    NOW() - INTERVAL 1 HOUR
FROM air_quality_readings
WHERE location = 'Delhi' AND aqi > 150
  AND recorded_at >= NOW() - INTERVAL 2 DAY
LIMIT 1;

-- -------------------------------------------------------
-- Sample disaster-linked alerts (Demonstration fixtures)
-- -------------------------------------------------------
INSERT INTO disaster_alerts (event_type, affected_area, aqi, priority, safety_advice, source, is_active) VALUES
('Industrial Smog & Chemical Emission', 'Mumbai', 285, 'Critical', 'Emergency advisory: Refrain from outdoor physical activity. Keep all windows and ventilation inlets tightly closed.', 'State Pollution Control Advisory (Demo)', 1),
('Seasonal Crop Residue Fire Smog', 'Delhi', 340, 'Emergency', 'Severe particulate emergency. High-grade particulate masks (N95/N99) required. Sensitive populations must remain indoors.', 'Regional Air Quality Warning (Demo)', 1)
ON DUPLICATE KEY UPDATE aqi = VALUES(aqi);
