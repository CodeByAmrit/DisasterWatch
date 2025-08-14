// services/eonetService.js
const axios = require('axios');

const EONET_URL = 'https://eonet.gsfc.nasa.gov/api/v3/events';

async function fetchEonetEvents() {
  try {
    const { data } = await axios.get(EONET_URL, { timeout: 10000 });
    if (!data?.events) return [];
    // Map to simplified structure
    const events = data.events.map(evt => {
      // pick the most recent geometry (may be multiple)
      const geometry = (evt.geometry && evt.geometry.length) ? evt.geometry[0] : null;
      const coords = geometry?.coordinates || null; // EONET uses [lng, lat]
      return {
        source: 'EONET',
        external_id: evt.id,
        title: evt.title,
        description: evt.description || '',
        link: `https://eonet.gsfc.nasa.gov/event/${evt.id}`,
        // geometry: { lat, lng, date }
        geometry: coords ? { lng: parseFloat(coords[0]), lat: parseFloat(coords[1]), date: geometry.date } : null,
        closed: !!evt.closed,
        categories: (evt.categories || []).map(c => c.title)
      };
    });
    return events;
  } catch (err) {
    console.error('EONET fetch error:', err.message);
    return [];
  }
}

module.exports = { fetchEonetEvents };