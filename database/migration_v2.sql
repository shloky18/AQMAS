-- AQMAS - Database Migration v2 (Module 3 & Module 5 enhancements)
-- Safe and idempotent migration script for MySQL 8.x

USE aqmas_db;

-- 1. Add optional pollutant columns to air_quality_readings if they do not exist
SET @dbname = DATABASE();

SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'air_quality_readings' AND COLUMN_NAME = 'co') > 0,
    'SELECT 1',
    'ALTER TABLE air_quality_readings ADD COLUMN co DECIMAL(6,2) NULL AFTER pm10;'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'air_quality_readings' AND COLUMN_NAME = 'no2') > 0,
    'SELECT 1',
    'ALTER TABLE air_quality_readings ADD COLUMN no2 DECIMAL(6,2) NULL AFTER co;'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'air_quality_readings' AND COLUMN_NAME = 'so2') > 0,
    'SELECT 1',
    'ALTER TABLE air_quality_readings ADD COLUMN so2 DECIMAL(6,2) NULL AFTER no2;'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'air_quality_readings' AND COLUMN_NAME = 'o3') > 0,
    'SELECT 1',
    'ALTER TABLE air_quality_readings ADD COLUMN o3 DECIMAL(6,2) NULL AFTER so2;'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 2. Add Module 5 Alert enhancements to alerts table
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'alerts' AND COLUMN_NAME = 'threshold_value') > 0,
    'SELECT 1',
    'ALTER TABLE alerts ADD COLUMN threshold_value INT NULL AFTER aqi;'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'alerts' AND COLUMN_NAME = 'severity') > 0,
    'SELECT 1',
    'ALTER TABLE alerts ADD COLUMN severity VARCHAR(50) NOT NULL DEFAULT "Unhealthy" AFTER threshold_value;'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'alerts' AND COLUMN_NAME = 'alert_type') > 0,
    'SELECT 1',
    'ALTER TABLE alerts ADD COLUMN alert_type VARCHAR(50) NOT NULL DEFAULT "threshold_breach" AFTER severity;'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'alerts' AND COLUMN_NAME = 'health_advice') > 0,
    'SELECT 1',
    'ALTER TABLE alerts ADD COLUMN health_advice TEXT NULL AFTER message;'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'alerts' AND COLUMN_NAME = 'acknowledged_at') > 0,
    'SELECT 1',
    'ALTER TABLE alerts ADD COLUMN acknowledged_at TIMESTAMP NULL AFTER status;'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add index for cooldown checks
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'alerts' AND INDEX_NAME = 'idx_cooldown') > 0,
    'SELECT 1',
    'ALTER TABLE alerts ADD INDEX idx_cooldown (location, alert_type, created_at);'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Backfill existing alerts with defaults if null
UPDATE alerts SET threshold_value = 100 WHERE threshold_value IS NULL;
UPDATE alerts SET severity = 'Unhealthy' WHERE severity IS NULL OR severity = '';
UPDATE alerts SET alert_type = 'threshold_breach' WHERE alert_type IS NULL OR alert_type = '';
UPDATE alerts SET health_advice = 'Everyone should reduce heavy outdoor exertion. Keep windows closed.' WHERE health_advice IS NULL;

-- 3. Create disaster_alerts table
CREATE TABLE IF NOT EXISTS disaster_alerts (
    id            INT           AUTO_INCREMENT PRIMARY KEY,
    event_type    VARCHAR(100)  NOT NULL,
    affected_area VARCHAR(100)  NOT NULL,
    aqi           INT           NOT NULL,
    priority      VARCHAR(20)   NOT NULL DEFAULT 'High',
    safety_advice TEXT          NOT NULL,
    source        VARCHAR(100)  NOT NULL DEFAULT 'Demonstration Fixture',
    is_active     TINYINT(1)    NOT NULL DEFAULT 1,
    created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_disaster_area   (affected_area),
    INDEX idx_disaster_active (is_active)
);

-- Seed disaster demo events if empty
INSERT INTO disaster_alerts (event_type, affected_area, aqi, priority, safety_advice, source, is_active)
SELECT 'Industrial Smog & Chemical Emission', 'Mumbai', 285, 'Critical', 'Emergency advisory: Refrain from outdoor physical activity. Keep all windows and ventilation inlets tightly closed.', 'State Pollution Control Advisory (Demo)', 1
WHERE NOT EXISTS (SELECT 1 FROM disaster_alerts WHERE affected_area = 'Mumbai');

INSERT INTO disaster_alerts (event_type, affected_area, aqi, priority, safety_advice, source, is_active)
SELECT 'Seasonal Crop Residue Fire Smog', 'Delhi', 340, 'Emergency', 'Severe particulate emergency. High-grade particulate masks (N95/N99) required. Sensitive populations must remain indoors.', 'Regional Air Quality Warning (Demo)', 1
WHERE NOT EXISTS (SELECT 1 FROM disaster_alerts WHERE affected_area = 'Delhi');
