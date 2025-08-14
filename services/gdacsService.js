// services/gdacsService.js
const axios = require('axios');
const xml2js = require('xml2js');

const GDACS_URL = 'https://www.gdacs.org/xml/rss.xml';

async function fetchGdacsAlerts() {
  try {
    const res = await axios.get(GDACS_URL, { timeout: 10000 });
    const parser = new xml2js.Parser({ explicitArray: true });
    const xml = await parser.parseStringPromise(res.data);

    const items = xml?.rss?.channel?.[0]?.item || [];

    const alerts = items.map(it => {
      const guid = it.guid?.[0]?._ || it.guid?.[0] || null;
      const pubDate = it.pubDate?.[0] ? new Date(it.pubDate[0]) : null;

      return {
        source: 'GDACS',
        external_id: guid,
        title: it.title?.[0] || 'GDACS Alert',
        description: it.description?.[0] || '',
        link: it.link?.[0] || '',
        alert_time: pubDate,
        severity: 'Unknown',
        geometry: null
      };
    });

    return alerts;
  } catch (err) {
    console.error('GDACS fetch error:', err.message);
    return [];
  }
}

module.exports = { fetchGdacsAlerts };
