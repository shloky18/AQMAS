-- AQMAS - Air Quality Alert Generation System
-- Database: aqmas_db
-- schema.sql: creates the database and all required tables

-- Create and select the database
CREATE DATABASE IF NOT EXISTS aqmas_db;
USE aqmas_db;

-- -------------------------------------------------------
-- Table: air_quality_readings
-- Stores each AQI reading for a location with all monitored pollutants
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS air_quality_readings (
    id           INT           AUTO_INCREMENT PRIMARY KEY,
    location     VARCHAR(100)  NOT NULL,
    aqi          INT           NOT NULL,
    pm25         DECIMAL(6,2)  NOT NULL,
    pm10         DECIMAL(6,2)  NOT NULL,
    co           DECIMAL(6,2)  NULL,
    no2          DECIMAL(6,2)  NULL,
    so2          DECIMAL(6,2)  NULL,
    o3           DECIMAL(6,2)  NULL,
    severity     VARCHAR(50)   NOT NULL,
    recorded_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_location        (location),
    INDEX idx_recorded_at     (recorded_at)
);

-- -------------------------------------------------------
-- Table: aqi_thresholds
-- Stores threshold config per location (single-user application default)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS aqi_thresholds (
    id               INT           AUTO_INCREMENT PRIMARY KEY,
    location         VARCHAR(100)  NOT NULL UNIQUE,
    threshold_value  INT           NOT NULL DEFAULT 100,
    enabled          TINYINT(1)    NOT NULL DEFAULT 1,

    INDEX idx_threshold_location (location)
);

-- -------------------------------------------------------
-- Table: alerts
-- Stores alerts generated when AQI exceeds a threshold or spikes
-- Supports severity, alert_type, threshold_value, plain-language health advice, and cooldown indexing
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS alerts (
    id               INT           AUTO_INCREMENT PRIMARY KEY,
    reading_id       INT           NOT NULL,
    location         VARCHAR(100)  NOT NULL,
    aqi              INT           NOT NULL,
    threshold_value  INT           NULL,
    severity         VARCHAR(50)   NOT NULL DEFAULT 'Unhealthy',
    alert_type       VARCHAR(50)   NOT NULL DEFAULT 'threshold_breach',
    message          VARCHAR(255)  NOT NULL,
    health_advice    TEXT          NULL,
    created_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status           ENUM('active', 'acknowledged') NOT NULL DEFAULT 'active',
    acknowledged_at  TIMESTAMP     NULL,

    INDEX idx_alert_location   (location),
    INDEX idx_alert_status     (status),
    INDEX idx_cooldown         (location, alert_type, created_at),

    CONSTRAINT fk_alert_reading
        FOREIGN KEY (reading_id)
        REFERENCES air_quality_readings (id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- -------------------------------------------------------
-- Table: disaster_alerts
-- Stores disaster-linked pollution alerts (demonstration fixtures or external feeds)
-- -------------------------------------------------------
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
