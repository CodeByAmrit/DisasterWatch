const db = require('../config/db');
const { syncAlerts } = require('../services/syncService');

// Fetch paginated alerts with optional filters
exports.getAlerts = async (req, res) => {
  try {
    let { page = 1, limit = 20, country, severity, type } = req.query;
    page = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || 20;
    const offset = (page - 1) * limit;

    const whereClauses = [];
    const params = [];

    if (country) {
      whereClauses.push('country = ?');
      params.push(country);
    }
    if (severity) {
      whereClauses.push('severity_enum = ?');
      params.push(severity);
    }
    if (type) {
      whereClauses.push('event_type = ?');
      params.push(type);
    }

    const where = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Total count
    const countSql = `SELECT COUNT(*) AS total FROM alerts ${where}`;
    const [[{ total }]] = await db.execute(countSql, params);

    // Fetch data: LIMIT and OFFSET injected directly
    const dataSql = `
      SELECT id, title, event_type, alert_level, severity_enum, country, iso3,
             ST_X(location) AS lon, ST_Y(location) AS lat, event_time
      FROM alerts
      ${where}
      ORDER BY event_time DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const [rows] = await db.execute(dataSql, params);

    res.json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('getAlerts error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Fetch single alert by ID
exports.getAlertById = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM alerts WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Alert not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('getAlertById error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Fetch alerts for map plotting
exports.getAlertsForMap = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT id, title, severity_enum, country, ST_X(location) AS lon, ST_Y(location) AS lat
      FROM alerts
      WHERE location IS NOT NULL
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getAlertsForMap error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Trigger manual GDACS sync
exports.forceSync = async (req, res) => {
  try {
    const result = await syncAlerts();
    res.json(result);
  } catch (err) {
    console.error('forceSync error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};
