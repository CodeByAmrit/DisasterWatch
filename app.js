const cron = require('node-cron');
const { syncAlerts } = require('./services/syncService.js');
const express = require('express');
const app = express();
const alertsRoutes = require('./routes/alerts');
const countriesRoutes = require('./routes/countries');

app.use(express.json());

// API routes
app.use('/api/alerts', alertsRoutes);
app.use('/api/countries', countriesRoutes);

// Optional: EJS templates
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.get('/', (req, res) => {
  res.render('dashboard'); // Main dashboard page
});

// Run every hour
cron.schedule('0 * * * *', () => {
  console.log('⏳ Running disaster alerts sync...');
  syncAlerts();
});

module.exports =  app;
