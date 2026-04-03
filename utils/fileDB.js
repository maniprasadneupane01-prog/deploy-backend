'use strict';
const fs   = require('fs');
const path = require('path');

// Always use /tmp on Render (always writable, no disk needed)
// Fall back to local data dir for development
const DATA_DIR = process.env.DATA_DIR || '/tmp/biraj-data';

function generateId(prefix = 'BDC') {
  const now  = new Date();
  const y    = now.getFullYear();
  const m    = String(now.getMonth() + 1).padStart(2, '0');
  const d    = String(now.getDate()).padStart(2, '0');
  const rand = String(Math.floor(1000 + Math.random() * 9000));
  return `${prefix}-${y}${m}${d}-${rand}`;
}

function initDB() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  ['appointments', 'contacts'].forEach(name => {
    const fp = path.join(DATA_DIR, `${name}.json`);
    if (!fs.existsSync(fp)) fs.writeFileSync(fp, '[]', 'utf8');
  });

  // Auto-migrate: assign IDs to any records missing them
  ['appointments', 'contacts'].forEach(name => {
    const fp = path.join(DATA_DIR, `${name}.json`);
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    let changed = false;
    data.forEach(r => {
      if (!r.id) {
        r.id = generateId(name === 'appointments' ? 'BDC' : 'CTC');
        changed = true;
      }
    });
    if (changed) {
      fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
      console.log(`[DB] Migrated ${name}: assigned IDs to ${data.filter(r => r.id.startsWith(name === 'appointments' ? 'BDC' : 'CTC')).length} records`);
    }
  });

  console.log(`[DB] Initialized at ${DATA_DIR}`);
}

function readAll(collection) {
  try {
    const fp = path.join(DATA_DIR, `${collection}.json`);
    return JSON.parse(fs.readFileSync(fp, 'utf8'));
  } catch { return []; }
}

function writeAll(collection, data) {
  try {
    const fp = path.join(DATA_DIR, `${collection}.json`);
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) { /* ignore */ }
}

function create(collection, record) {
  const all = readAll(collection);
  all.push(record);
  writeAll(collection, all);
  return record;
}

function findById(collection, id) {
  return readAll(collection).find(r => r.id === id) ?? null;
}

function findMany(collection, filterFn = null) {
  const all = readAll(collection);
  return filterFn ? all.filter(filterFn) : all;
}

function updateById(collection, id, updates) {
  const all = readAll(collection);
  const idx = all.findIndex(r => r.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...updates, updatedAt: new Date().toISOString() };
  writeAll(collection, all);
  return all[idx];
}

function deleteById(collection, id) {
  const all = readAll(collection);
  const filtered = all.filter(r => r.id !== id);
  if (filtered.length === all.length) return false;
  writeAll(collection, filtered);
  return true;
}

function count(collection, filterFn = null) {
  return findMany(collection, filterFn).length;
}

module.exports = {
  initDB,
  readAll, writeAll,
  create, findById, findMany,
  updateById, deleteById, count
};
