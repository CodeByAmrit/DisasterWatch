const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all countries
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT iso3, name, lat, lon FROM country_centroids ORDER BY name');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
