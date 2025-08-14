const express = require('express');
const router = express.Router();
const axios = require('axios');

// Base API URL
const API_BASE = 'http://localhost:3000/api/alerts';

// Dashboard page
router.get('/dashboard', async (req, res) => {
  try {
    // Get page and limit from query (fallback to page 1, limit 20)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    // Fetch alerts from API with pagination
    const response = await axios.get(`${API_BASE}?page=${page}&limit=${limit}`);
    const alertsData = response.data.success ? response.data : { data: [], pagination: { page: 1, total: 0, totalPages: 1 } };
    const alerts = alertsData.data;
    const pagination = {
      currentPage: page,
      total: alertsData.pagination.total || 0,
      totalPages: alertsData.pagination.totalPages || 1,
      prevPage: page > 1 ? page - 1 : 1,
      nextPage: page < (alertsData.pagination.totalPages || 1) ? page + 1 : (alertsData.pagination.totalPages || 1),
      from: (page - 1) * limit + 1,
      to: Math.min(page * limit, alertsData.pagination.total || 0)
    };

    // Compute counts for the summary cards
    const alertsCount = { severe: 0, moderate: 0, minor: 0 };
    alertsData.data.forEach(a => {
      const sev = a.severity_enum ? a.severity_enum.toLowerCase() : '';
      if (alertsCount[sev] !== undefined) alertsCount[sev]++;
    });

    // Fetch total countries count from API (optional: you can have a /api/countries/count endpoint)
    const countriesResponse = await axios.get('http://localhost:3000/api/countries'); 
    const countriesCount = countriesResponse.data.success ? countriesResponse.data.data.length : 0;

    res.render('public/dashboard', { alerts, pagination, alertsCount, countriesCount, limit  });
  } catch (err) {
    console.error('Error fetching alerts:', err.message);
    res.render('public/dashboard', { alerts: [], pagination: {}, alertsCount: { severe:0, moderate:0, minor:0 }, countriesCount: 0, error: 'Failed to load alerts' });
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
