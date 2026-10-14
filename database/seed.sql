-- AQMAS - Air Quality Alert Generation System
-- seed.sql: inserts sample data for demonstration
-- Run AFTER schema.sql

USE aqmas_db;

-- -------------------------------------------------------
-- Sample air quality readings (historical data)
-- Note: These are simulated readings for demonstration only
--       and are NOT live measurements.
-- -------------------------------------------------------

-- Mumbai readings (past 7 days, newest first in seed order)
INSERT INTO air_quality_readings (location, aqi, pm25, pm10, severity, recorded_at) VALUES
('Mumbai', 162, 68.5,  120.3, 'Unhealthy',             NOW() - INTERVAL 1  HOUR),
('Mumbai', 145, 61.2,  110.8, 'Unhealthy',             NOW() - INTERVAL 4  HOUR),
('Mumbai', 118, 49.0,   95.5, 'Unhealthy for Sensitive Groups', NOW() - INTERVAL 8  HOUR),
('Mumbai', 95,  39.1,   80.2, 'Moderate',              NOW() - INTERVAL 12 HOUR),
('Mumbai', 78,  30.5,   65.4, 'Moderate',              NOW() - INTERVAL 1  DAY),
('Mumbai', 60,  22.8,   50.1, 'Moderate',              NOW() - INTERVAL 2  DAY),
('Mumbai', 45,  15.2,   38.7, 'Good',                  NOW() - INTERVAL 3  DAY),
('Mumbai', 110, 45.0,   90.0, 'Unhealthy for Sensitive Groups', NOW() - INTERVAL 4  DAY),
('Mumbai', 135, 56.0,  105.0, 'Unhealthy',             NOW() - INTERVAL 5  DAY),
('Mumbai', 88,  35.5,   72.0, 'Moderate',              NOW() - INTERVAL 6  DAY);

-- Delhi readings
INSERT INTO air_quality_readings (location, aqi, pm25, pm10, severity, recorded_at) VALUES
('Delhi', 210, 95.0,  185.5, 'Very Unhealthy',         NOW() - INTERVAL 1  HOUR),
('Delhi', 198, 88.3,  172.0, 'Very Unhealthy',         NOW() - INTERVAL 4  HOUR),
('Delhi', 175, 75.0,  150.2, 'Unhealthy',              NOW() - INTERVAL 8  HOUR),
('Delhi', 160, 68.0,  135.5, 'Unhealthy',              NOW() - INTERVAL 12 HOUR),
('Delhi', 142, 59.5,  118.0, 'Unhealthy',              NOW() - INTERVAL 1  DAY),
('Delhi', 120, 50.0,   98.0, 'Unhealthy for Sensitive Groups', NOW() - INTERVAL 2  DAY),
('Delhi', 95,  39.0,   80.0, 'Moderate',               NOW() - INTERVAL 3  DAY),
('Delhi', 185, 80.0,  160.0, 'Unhealthy',              NOW() - INTERVAL 4  DAY),
('Delhi', 220, 100.5, 195.0, 'Very Unhealthy',         NOW() - INTERVAL 5  DAY),
('Delhi', 155, 64.0,  128.0, 'Unhealthy',              NOW() - INTERVAL 6  DAY);

-- Pune readings
INSERT INTO air_quality_readings (location, aqi, pm25, pm10, severity, recorded_at) VALUES
('Pune', 75,  28.5,  60.3, 'Moderate',                 NOW() - INTERVAL 1  HOUR),
('Pune', 82,  32.1,  65.8, 'Moderate',                 NOW() - INTERVAL 4  HOUR),
('Pune', 65,  23.0,  52.5, 'Moderate',                 NOW() - INTERVAL 8  HOUR),
('Pune', 48,  16.2,  40.0, 'Good',                     NOW() - INTERVAL 12 HOUR),
('Pune', 38,  12.5,  32.0, 'Good',                     NOW() - INTERVAL 1  DAY),
('Pune', 55,  19.8,  46.5, 'Moderate',                 NOW() - INTERVAL 2  DAY),
('Pune', 42,  14.0,  35.8, 'Good',                     NOW() - INTERVAL 3  DAY),
('Pune', 88,  35.0,  71.0, 'Moderate',                 NOW() - INTERVAL 4  DAY),
('Pune', 105, 43.0,  88.0, 'Unhealthy for Sensitive Groups', NOW() - INTERVAL 5  DAY),
('Pune', 70,  26.0,  57.0, 'Moderate',                 NOW() - INTERVAL 6  DAY);

-- Bangalore readings
INSERT INTO air_quality_readings (location, aqi, pm25, pm10, severity, recorded_at) VALUES
('Bangalore', 52, 18.0, 44.0, 'Good',                  NOW() - INTERVAL 1  HOUR),
('Bangalore', 60, 21.5, 50.5, 'Moderate',              NOW() - INTERVAL 4  HOUR),
('Bangalore', 45, 15.0, 38.5, 'Good',                  NOW() - INTERVAL 8  HOUR),
('Bangalore', 70, 26.0, 57.5, 'Moderate',              NOW() - INTERVAL 12 HOUR),
('Bangalore', 35, 11.0, 28.0, 'Good',                  NOW() - INTERVAL 1  DAY),
('Bangalore', 48, 16.5, 41.0, 'Good',                  NOW() - INTERVAL 2  DAY),
('Bangalore', 78, 30.0, 63.0, 'Moderate',              NOW() - INTERVAL 3  DAY),
('Bangalore', 92, 38.0, 77.0, 'Moderate',              NOW() - INTERVAL 4  DAY),
('Bangalore', 55, 19.5, 46.0, 'Moderate',              NOW() - INTERVAL 5  DAY),
('Bangalore', 40, 13.5, 32.5, 'Good',                  NOW() - INTERVAL 6  DAY);

-- -------------------------------------------------------
-- Default AQI thresholds (one per location)
-- -------------------------------------------------------
INSERT INTO aqi_thresholds (location, threshold_value, enabled) VALUES
('Mumbai',    100, 1),
('Delhi',     150, 1),
('Pune',      100, 1),
('Bangalore',  80, 1);

-- -------------------------------------------------------
-- Sample alerts based on existing high-AQI readings
-- -------------------------------------------------------
INSERT INTO alerts (reading_id, location, aqi, message, created_at, status)
SELECT
    id,
    location,
    aqi,
    CONCAT('ALERT: AQI of ', aqi, ' in ', location, ' has exceeded the configured threshold. Immediate attention recommended.'),
    recorded_at,
    'active'
FROM air_quality_readings
WHERE location = 'Mumbai' AND aqi > 100
  AND recorded_at >= NOW() - INTERVAL 2 DAY
LIMIT 2;

INSERT INTO alerts (reading_id, location, aqi, message, created_at, status)
SELECT
    id,
    location,
    aqi,
    CONCAT('ALERT: AQI of ', aqi, ' in ', location, ' has exceeded the configured threshold. Immediate attention recommended.'),
    recorded_at,
    'acknowledged'
FROM air_quality_readings
WHERE location = 'Delhi' AND aqi > 150
  AND recorded_at >= NOW() - INTERVAL 2 DAY
LIMIT 2;
