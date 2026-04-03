'use strict';
const fs   = require('fs');
const path = require('path');

// Use /tmp on Render (ephemeral but always writable)
// Use local data/ directory when running locally
const DATA_DIR = process.env.NODE_ENV === 'production'
  ? '/tmp/biraj-data'
  : path.join(__dirname, '../data');

function initDB() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log(`[DB] Created data directory at ${DATA_DIR}`);
  }
  ['appointments', 'contacts'].forEach(name => {
    const fp = path.join(DATA_DIR, `${name}.json`);
    if (!fs.existsSync(fp)) {
      fs.writeFileSync(fp, JSON.stringify([], null, 2), 'utf8');
      console.log(`[DB] Initialized ${name}.json`);
    }
  });
}

function readAll(collection) {
  const fp  = path.join(DATA_DIR, `${collection}.json`);
  const raw = fs.readFileSync(fp, 'utf8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error(`${collection}.json is not an array`);
  return parsed;
}

function writeAll(collection, data) {
  const fp   = path.join(DATA_DIR, `${collection}.json`);
  const tmp  = fp + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, fp);
}

function create(collection, record) {
  const all = readAll(collection);
  all.push(record);
  writeAll(collection, all);
  return record;
}

function findById(collection, id) {
  const all = readAll(collection);
  return all.find(r => r.id === id) ?? null;
}

function findMany(collection, filterFn = null) {
  const all = readAll(collection);
  return filterFn ? all.filter(filterFn) : all;
}

function updateById(collection, id, updates) {
  const all = readAll(collection);
  const idx = all.findIndex(r => r.id === id);
  if (idx === -1) return null;
  all[idx] = {
    ...all[idx],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  writeAll(collection, all);
  return all[idx];
}

function deleteById(collection, id) {
  const all      = readAll(collection);
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
