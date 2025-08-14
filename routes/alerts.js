const express = require('express');
const router = express.Router();
const alertsController = require('../controllers/alertsController');
const { syncAlerts } = require('../services/syncService');

// ==============================
// ALERT ROUTES
// ==============================

// Get paginated alerts with optional filters
// Example: /api/alerts?page=1&limit=20&severity=severe&country=Greece
router.get('/', alertsController.getAlerts);

// Get single alert by ID
router.get('/:id', alertsController.getAlertById);

// Get alerts for map plotting
router.get('/map/data', alertsController.getAlertsForMap);

// Trigger manual sync (POST)
router.get('/sync', async (req, res) => {
  try {
    const result = await syncAlerts();
    if (result.success) return res.json(result);
    return res.status(500).json(result);
  } catch (err) {
    console.error('POST /alerts/sync error:', err.message);
    res.status(500).json({ success: false, error: err.message || 'Sync failed' });
  }
});
module.exports = router;
