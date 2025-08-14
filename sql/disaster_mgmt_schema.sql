-- disaster_watch_schema.sql
CREATE DATABASE IF NOT EXISTS disaster_watch
  DEFAULT CHARACTER SET = 'utf8mb4' COLLATE = 'utf8mb4_unicode_ci';
USE disaster_watch;
SET NAMES utf8mb4;
SET sql_mode = 'STRICT_ALL_TABLES';

-- SOURCES TABLE
CREATE TABLE IF NOT EXISTS sources (
  id TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(32) NOT NULL,
  name VARCHAR(120) NOT NULL,
  base_url VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sources_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- COUNTRY CENTROIDS TABLE
CREATE TABLE IF NOT EXISTS country_centroids (
  iso3 CHAR(3) NOT NULL,
  name VARCHAR(120) NOT NULL,
  lat DECIMAL(10,6) NOT NULL,
  lon DECIMAL(10,6) NOT NULL,
  PRIMARY KEY (iso3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ALERTS TABLE (with country-level support)
CREATE TABLE IF NOT EXISTS alerts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  source_id TINYINT UNSIGNED NOT NULL,
  external_id VARCHAR(120) NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  event_type VARCHAR(32) NULL,
  category VARCHAR(100) NULL,
  alert_level VARCHAR(32) NULL,
  severity_enum ENUM('minor','moderate','severe','extreme') NOT NULL DEFAULT 'moderate',
  severity_value DECIMAL(10,3) NULL,
  severity_unit VARCHAR(20) NULL,
  population_estimate BIGINT NULL,
  country VARCHAR(120) NULL,
  iso3 CHAR(3) NULL,
  link VARCHAR(500) NULL,
  event_time DATETIME NULL,
  expires_at DATETIME NULL,
  location POINT SRID 4326 NULL,
  bbox VARCHAR(255) NULL,
  is_country_level TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_alerts_source_external (source_id, external_id),
  INDEX idx_alerts_event_time (event_time),
  INDEX idx_alerts_status (alert_level),
  INDEX idx_alerts_category (category),
  INDEX idx_alerts_country_level (is_country_level),
  SPATIAL INDEX spx_alerts_location (location),
  CONSTRAINT fk_alerts_source FOREIGN KEY (source_id) REFERENCES sources(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- INITIAL DATA
INSERT INTO sources (code, name, base_url) VALUES
  ('GDACS', 'Global Disaster Alert and Coordination System', 'https://www.gdacs.org/'),
  ('EONET', 'NASA Earth Observatory Natural Event Tracker', 'https://eonet.gsfc.nasa.gov/'),
  ('MANUAL', 'Manual / Admin Entered', NULL)
ON DUPLICATE KEY UPDATE name = VALUES(name), base_url = VALUES(base_url);

-- SAMPLE COUNTRY CENTROIDS
INSERT INTO country_centroids (iso3, name, lat, lon) VALUES
  ('ALB', 'Albania', 41.1533, 20.1683),
  ('BGR', 'Bulgaria', 42.7339, 25.4858),
  ('GRC', 'Greece', 39.0742, 21.8243),
  ('MKD', 'North Macedonia', 41.6086, 21.7453),
  ('TUR', 'Turkey', 38.9637, 35.2433),
  ('BRA', 'Brazil', -14.2350, -51.9253),
  ('IND', 'India', 20.5937, 78.9629),
  ('PAK', 'Pakistan', 30.3753, 69.3451),
  ('BGD', 'Bangladesh', 23.6850, 90.3563),
  ('NPL', 'Nepal', 28.3949, 84.1240),
  ('BTN', 'Bhutan', 27.5142, 90.4336),
  ('LKA', 'Sri Lanka', 7.8731, 80.7718),
  ('MDV', 'Maldives', 3.2028, 73.2207),
  ('AFG', 'Afghanistan', 33.9391, 67.7100),
  ('IRN', 'Iran', 32.4279, 53.6880)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  lat = VALUES(lat),
  lon = VALUES(lon);


ALTER TABLE alerts 
MODIFY COLUMN location POINT SRID 4326 NULL;

ALTER TABLE alerts 
DROP INDEX spx_alerts_location;