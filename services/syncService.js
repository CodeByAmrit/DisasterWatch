const axios = require('axios');
const xml2js = require('xml2js');
const db = require('../config/db');

const GDACS_FEED = 'https://www.gdacs.org/xml/rss.xml';

function forceCoordinates(item) {
  // Helper function to force values within ranges
  const clamp = (num, min, max) => {
    if (isNaN(num)) return 0;
    return Math.min(Math.max(num, min), max);
  };
  
  let lat = 0, lon = 0;
  
  // Try geo:Point first
  if (item['geo:Point']) {
    lat = clamp(parseFloat(item['geo:Point']['geo:lat']), -90, 90);
    lon = clamp(parseFloat(item['geo:Point']['geo:long']), -180, 180);
  } 
  // Try georss:point next
  else if (item['georss:point']) {
    const parts = item['georss:point'].toString().trim().split(/\s+/);
    if (parts.length >= 2) {
      lat = clamp(parseFloat(parts[0]), -90, 90);
      lon = clamp(parseFloat(parts[1]), -180, 180);
    }
  }
  
  return { lat, lon };
}

async function syncAlerts() {
  console.log('Force-syncing GDACS alerts (with coordinate clamping)...');
  const parser = new xml2js.Parser({ explicitArray: false });

  try {
    const res = await axios.get(GDACS_FEED);
    const feed = await parser.parseStringPromise(res.data);
    const items = Array.isArray(feed.rss.channel.item) 
      ? feed.rss.channel.item 
      : [feed.rss.channel.item];

    const conn = await db.getConnection();
    let inserted = 0, updated = 0;

    try {
      await conn.beginTransaction();

      for (const item of items) {
        try {
          const coords = forceCoordinates(item);
          const wktPoint = `POINT(${coords.lon} ${coords.lat})`;

          const sql = `
            INSERT INTO alerts (
              source_id, title, description, event_type, location, 
              country, iso3, link, event_time, expires_at
            ) VALUES (
              1, ?, ?, ?, ST_GeomFromText(?, 4326), 
              ?, ?, ?, ?, ?
            ) ON DUPLICATE KEY UPDATE
              title = VALUES(title),
              description = VALUES(description),
              updated_at = CURRENT_TIMESTAMP
          `;

          const params = [
            item.title || 'Untitled Alert',
            item.description || null,
            item['gdacs:eventtype'] || null,
            wktPoint,
            item['gdacs:country'] || null,
            item['gdacs:iso3'] || null,
            item.link || null,
            item['gdacs:fromdate'] ? new Date(item['gdacs:fromdate']) : null,
            item['gdacs:todate'] ? new Date(item['gdacs:todate']) : null
          ];

          const [result] = await conn.execute(sql, params);
          if (result.insertId) inserted++;
          else updated++;
        } catch (itemErr) {
          console.warn(`Skipping item due to error: ${itemErr.message}`);
        }
      }

      await conn.commit();
      console.log(`Force-sync complete. inserted=${inserted} updated=${updated}`);
      return { success: true, inserted, updated };
      
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Force-sync failed:', err);
    return { success: false, error: err.message };
  }
}

module.exports = { syncAlerts };