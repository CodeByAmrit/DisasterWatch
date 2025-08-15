const cron = require('node-cron');
const { syncAlerts } = require('./services/syncService.js');
const express = require('express');
const app = express();
const alertsRoutes = require('./routes/alerts');
const countriesRoutes = require('./routes/countries');
const web_router = require('./routes/web.js');

app.use(express.json());

const path = require('path')
app.use('/', express.static(path.join(__dirname, 'public')))

// API routes
app.use('/api/alerts', alertsRoutes);
app.use('/api/countries', countriesRoutes);

// Optional: EJS templates
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.use('/', web_router);

// Run every hour
// cron.schedule('0 * * * *', () => {
//   console.log('⏳ Running disaster alerts sync...');
//   syncAlerts();
// });

// app.use('', (req, res) => res.status(404).render('404'));

module.exports =  app;
