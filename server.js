'use strict';

// Catch startup crashes so Render logs the real error
process.on('uncaughtException', (err) => {
  console.error('[FATAL UNCAUGHT]', err.stack || err.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[FATAL REJECTION]', reason);
});

require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const path     = require('path');

console.log('[BOOT] Starting Biraj Dental API...');
console.log('[BOOT] NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('[BOOT] PORT:', process.env.PORT || '5000');
console.log('[BOOT] DATA_DIR:', process.env.DATA_DIR || '/tmp/biraj-data');

const { initDB, readAll } = require('./utils/fileDB');

initDB();
console.log('[BOOT] Database initialized successfully');

const app = express();

app.use(cors());
app.options('*', cors());
app.use(express.json({ limit: '10kb' }));
app.use(require('./middleware/requestLogger'));

app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/contact',      require('./routes/contacts'));

// Serve built frontend (if present)
const FRONTEND_DIST = path.join(__dirname, '../frontend/dist');
if (require('fs').existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  app.get('{*path}', (req, res, next) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
    } else {
      next();
    }
  });
}

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

app.get('/', (req, res) => {
  res.json({
    name:    'Biraj Dental Hospital API',
    version: '2.0',
    docs:    'See /api/health for status',
    endpoints: {
      health:       'GET /api/health',
      appointments: 'GET/POST /api/appointments',
      slots:        'GET /api/appointments/slots?date=&branch=',
      contact:      'POST /api/contact',
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
