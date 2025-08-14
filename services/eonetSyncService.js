const axios = require('axios');
const db = require('../config/db');

const EONET_API = 'https://eonet.gsfc.nasa.gov/api/v3/events';

class EONETSyncService {
  constructor() {
    this.batchSize = 50;
    this.retryCount = 3;
    this.retryDelay = 5000;
  }

  async syncEvents() {
    try {
      console.log('Starting EONET sync...');
      
      // Fetch events from EONET API
      const response = await this.fetchWithRetry(EONET_API);
      const events = response.data.events || [];
      
      console.log(`Processing ${events.length} events from EONET`);
      
      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();
        
        let processed = 0;
        for (const event of events) {
          try {
            await this.processEvent(conn, event);
            processed++;
          } catch (error) {
            console.error(`Error processing event ${event.id}:`, error.message);
          }
        }
        
        await conn.commit();
        console.log(`EONET sync completed. Processed ${processed} events.`);
        return { success: true, processed };
      } catch (error) {
        await conn.rollback();
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('EONET sync failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async processEvent(conn, event) {
    // Insert or update event
    await conn.execute(
      `INSERT INTO events (id, title, description, link, closed)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         title = VALUES(title),
         description = VALUES(description),
         link = VALUES(link),
         closed = VALUES(closed)`,
      [
        event.id,
        event.title,
        event.description || null,
        event.link,
        event.closed ? new Date(event.closed) : null
      ]
    );

    // Process categories
    for (const category of event.categories || []) {
      await conn.execute(
        `INSERT IGNORE INTO categories (id, title) VALUES (?, ?)`,
        [category.id, category.title]
      );
      
      await conn.execute(
        `INSERT IGNORE INTO event_categories (event_id, category_id) VALUES (?, ?)`,
        [event.id, category.id]
      );
    }

    // Process sources
    for (const source of event.sources || []) {
      await conn.execute(
        `INSERT INTO sources (id, url)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE url = VALUES(url)`,
        [source.id, source.url]
      );
      
      await conn.execute(
        `INSERT IGNORE INTO event_sources (event_id, source_id) VALUES (?, ?)`,
        [event.id, source.id]
      );
    }

    // Process geometries
    await conn.execute(
      'DELETE FROM event_geometries WHERE event_id = ?',
      [event.id]
    );

    for (const geometry of event.geometry || []) {
      // Ensure coordinates are in [lon, lat] format for GeoJSON
      let coordinates = geometry.coordinates;
      if (geometry.type === 'Point' && coordinates.length === 2) {
        coordinates = [coordinates[1], coordinates[0]]; // Store as [lat, lon] for MySQL POINT
      }

      await conn.execute(
        `INSERT INTO event_geometries 
         (event_id, date, type, coordinates, magnitude_value, magnitude_unit)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          event.id,
          new Date(geometry.date),
          geometry.type,
          JSON.stringify(coordinates),
          geometry.magnitudeValue || null,
          geometry.magnitudeUnit || null
        ]
      );
    }
  }

  async fetchWithRetry(url, attempts = this.retryCount) {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: { 'Accept': 'application/json' }
      });
      return response;
    } catch (error) {
      if (attempts <= 1) throw error;
      await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      return this.fetchWithRetry(url, attempts - 1);
    }
  }
}

module.exports = new EONETSyncService();