-- AQMAS - Air Quality Alert Generation System
-- Database: aqmas_db
-- schema.sql: creates the database and all required tables

-- Create and select the database
CREATE DATABASE IF NOT EXISTS aqmas_db;
USE aqmas_db;

-- -------------------------------------------------------
-- Table: air_quality_readings
-- Stores each AQI reading for a location
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS air_quality_readings (
    id           INT           AUTO_INCREMENT PRIMARY KEY,
    location     VARCHAR(100)  NOT NULL,
    aqi          INT           NOT NULL,
    pm25         DECIMAL(6,2)  NOT NULL,
    pm10         DECIMAL(6,2)  NOT NULL,
    severity     VARCHAR(50)   NOT NULL,
    recorded_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_location        (location),
    INDEX idx_recorded_at     (recorded_at)
);

-- -------------------------------------------------------
-- Table: aqi_thresholds
-- Stores one threshold config per location (UNIQUE on location)
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
-- Stores alerts generated when AQI exceeds a threshold
-- Foreign key to air_quality_readings with RESTRICT on delete
-- so readings with alerts cannot be accidentally deleted
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS alerts (
    id          INT           AUTO_INCREMENT PRIMARY KEY,
    reading_id  INT           NOT NULL,
    location    VARCHAR(100)  NOT NULL,
    aqi         INT           NOT NULL,
    message     VARCHAR(255)  NOT NULL,
    created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status      ENUM('active', 'acknowledged') NOT NULL DEFAULT 'active',

    INDEX idx_alert_location   (location),
    INDEX idx_alert_status     (status),

    CONSTRAINT fk_alert_reading
        FOREIGN KEY (reading_id)
        REFERENCES air_quality_readings (id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);
