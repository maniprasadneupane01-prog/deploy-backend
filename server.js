'use strict';
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

const allowedOrigins = [
  process.env.ALLOWED_ORIGIN,
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173'
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (process.env.NODE_ENV === 'development') return cb(null, true);
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(null, false);
  },
  credentials: true
}));

app.use(express.json({ limit: '10kb' }));

app.use(async (req, res, next) => {
  try {
    next();
  } catch (err) {
    console.error('[ERROR]', err.message);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred. Please try again.'
    });
  }
});

app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/contact', require('./routes/contacts'));

app.get('/api/health', async (req, res) => {
  try {
    const { readAll } = require('./utils/fileDB');
    const appts = await readAll('appointments');
    res.json({
      status: 'ok',
      version: '2.0',
      timestamp: new Date().toISOString(),
      stats: {
        total: appts.length,
        pending: appts.filter(a => a.status === 'pending').length,
        confirmed: appts.filter(a => a.status === 'confirmed').length,
      }
    });
  } catch (err) {
    console.error('[HEALTH ERROR]', err.message);
    res.json({
      status: 'ok',
      version: '2.0',
      timestamp: new Date().toISOString(),
      stats: { total: 0, pending: 0, confirmed: 0 }
    });
  }
});

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Biraj Dental API is running' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found.` });
});

module.exports = app;
