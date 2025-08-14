const express = require('express');
const router = express.Router();  
const geoip = require('geoip-lite');
const axios = require('axios');

const API_BASE = 'http://localhost:3000/api/alerts';

router.get('/dashboard', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    // 1️⃣ Detect client country from IP
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const geo = geoip.lookup(ip);
    const clientCountryCode = geo?.country || null; // ISO2 code
    // Optional: map ISO2 to ISO3 if your alerts use ISO3
    const countryMap = {
      IN: 'IND',
      US: 'USA',
      // add more as needed
    };
    const clientIso3 = countryMap[clientCountryCode] || null;

    // 2️⃣ Fetch all alerts
    const response = await axios.get(`${API_BASE}?page=1&limit=1000`); // fetch all or large enough
    const allAlerts = response.data.success ? response.data.data : [];

    // 3️⃣ Sort alerts: client country first
    const clientAlerts = clientIso3
      ? allAlerts.filter(a => a.iso3 === clientIso3)
      : [];
    const otherAlerts = allAlerts.filter(a => a.iso3 !== clientIso3);
    const sortedAlerts = [...clientAlerts, ...otherAlerts];

    // 4️⃣ Paginate sorted alerts
    const total = sortedAlerts.length;
    const totalPages = Math.ceil(total / limit);
    const paginatedAlerts = sortedAlerts.slice((page - 1) * limit, page * limit);

    const pagination = {
      currentPage: page,
      total,
      totalPages,
      prevPage: page > 1 ? page - 1 : 1,
      nextPage: page < totalPages ? page + 1 : totalPages,
      from: (page - 1) * limit + 1,
      to: Math.min(page * limit, total)
    };

    // 5️⃣ Compute counts for summary cards
    const alertsCount = { severe: 0, moderate: 0, minor: 0 };
    allAlerts.forEach(a => {
      const sev = a.severity_enum?.toLowerCase();
      if (alertsCount[sev] !== undefined) alertsCount[sev]++;
    });

    // 6️⃣ Fetch countries count
    const countriesResponse = await axios.get('http://localhost:3000/api/countries');
    const countriesCount = countriesResponse.data.success ? countriesResponse.data.data.length : 0;

    // 7️⃣ Render dashboard
    res.render('public/dashboard', {
      alerts: paginatedAlerts,
      pagination,
      alertsCount,
      countriesCount,
      clientCountry: clientIso3,
      limit
    });

  } catch (err) {
    console.error('Error fetching alerts:', err.message);
    res.render('public/dashboard', {
      alerts: [],
      pagination: {},
      alertsCount: { severe:0, moderate:0, minor:0 },
      countriesCount: 0,
      error: 'Failed to load alerts'
    });
  }
});

// Alert details page
router.get('/alert/:id', async (req, res) => {
  try {
    const response = await axios.get(`${API_BASE}/${req.params.id}`);
    const alert = response.data.success ? response.data.data : null;
    res.render('public/alert-details', { alert });
  } catch (err) {
    console.error('Error fetching alert details:', err.message);
    res.render('public/alert-details', { alert: null, error: 'Failed to load alert' });
  }
});

// Map view (can render map with JS fetching /map/data)
router.get('/map', async (req, res) => {
  res.render('partials/map');
});

// Admin dashboard
router.get('/admin/dashboard', async (req, res) => {
  try {
    const response = await axios.get(`${API_BASE}?page=1&limit=50`);
    const alerts = response.data.success ? response.data.data : [];
    res.render('admin/dashboard', { alerts });
  } catch (err) {
    console.error('Admin dashboard error:', err.message);
    res.render('admin/dashboard', { alerts: [], error: 'Failed to load alerts' });
  }
});

// Admin settings page
router.get('/admin/settings', (req, res) => {
  res.render('admin/settings');
});

// Auth pages
router.get('/login', (req, res) => res.render('auth/login'));
router.get('/forgot-password', (req, res) => res.render('auth/forgot-password'));

// 404 page
// router.get('*', (req, res) => res.status(404).render('404'));

module.exports = router;
