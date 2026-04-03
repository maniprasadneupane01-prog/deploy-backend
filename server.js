'use strict';
require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const { initDB, readAll } = require('./utils/fileDB');

initDB();

const app = express();

const allowedOrigins = [
  process.env.ALLOWED_ORIGIN,
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173'
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(null, false);
  },
  credentials: true
}));
app.use(express.json({ limit: '10kb' }));
app.use(require('./middleware/requestLogger'));

app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/contact',      require('./routes/contacts'));

app.get('/api/health', (req, res) => {
  const appts = readAll('appointments');
  res.json({
    status:   'ok',
    version:  '2.0',
    timestamp: new Date().toISOString(),
    stats: {
      total:     appts.length,
      pending:   appts.filter(a => a.status === 'pending').length,
      confirmed: appts.filter(a => a.status === 'confirmed').length,
    }
  });
});

app.use((err, req, res, _next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({
    success: false,
    error:   'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred. Please try again.'
      : err.message
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found.` });
});

const PORT = parseInt(process.env.PORT || '5000', 10);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Biraj Dental API running on http://0.0.0.0:${PORT}`);
  console.log(`Health: http://0.0.0.0:${PORT}/api/health`);
});
