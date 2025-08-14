-- EONET Database Schema
CREATE DATABASE IF NOT EXISTS eonet_events
  DEFAULT CHARACTER SET = 'utf8mb4' COLLATE = 'utf8mb4_unicode_ci';
USE eonet_events;
SET NAMES utf8mb4;
SET sql_mode = 'STRICT_ALL_TABLES';

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(32) NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sources Table
CREATE TABLE IF NOT EXISTS sources (
  id VARCHAR(64) NOT NULL,
  title VARCHAR(100) NULL,
  url VARCHAR(255) NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Events Table
CREATE TABLE IF NOT EXISTS events (
  id VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  link VARCHAR(255) NULL,
  closed DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Event Categories Junction Table
CREATE TABLE IF NOT EXISTS event_categories (
  event_id VARCHAR(64) NOT NULL,
  category_id VARCHAR(32) NOT NULL,
  PRIMARY KEY (event_id, category_id),
  CONSTRAINT fk_event_cat_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT fk_event_cat_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Event Sources Junction Table
CREATE TABLE IF NOT EXISTS event_sources (
  event_id VARCHAR(64) NOT NULL,
  source_id VARCHAR(64) NOT NULL,
  PRIMARY KEY (event_id, source_id),
  CONSTRAINT fk_event_src_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT fk_event_src_source FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Event Geometries Table
CREATE TABLE IF NOT EXISTS event_geometries (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_id VARCHAR(64) NOT NULL,
  date DATETIME NOT NULL,
  type ENUM('Point','LineString','Polygon') NOT NULL,
  coordinates JSON NOT NULL,
  magnitude_value DECIMAL(12,4) NULL,
  magnitude_unit VARCHAR(32) NULL,
  location POINT SRID 4326 GENERATED ALWAYS AS (CASE WHEN type = 'Point' THEN ST_GeomFromText(CONCAT('POINT(', JSON_EXTRACT(coordinates, '$[1]'), ' ', JSON_EXTRACT(coordinates, '$[0]'), ')'), 4326)ELSE NULL END) STORED,
  PRIMARY KEY (id),
  INDEX idx_geom_event (event_id),
  SPATIAL INDEX spx_geom_location (location),
  CONSTRAINT fk_geom_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci; 