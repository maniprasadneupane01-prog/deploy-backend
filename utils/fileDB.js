'use strict';
const fs   = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, '../data');

function initDB() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log('[DB] Created data directory');
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
  try {
    const fp  = path.join(DATA_DIR, `${collection}.json`);
    const raw = fs.readFileSync(fp, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error(`${collection}.json is not an array`);
    return parsed;
  } catch (err) {
    throw new Error(`[DB] readAll(${collection}) failed: ${err.message}`);
  }
}

function writeAll(collection, data) {
  try {
    const fp   = path.join(DATA_DIR, `${collection}.json`);
    const tmp  = fp + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmp, fp);
  } catch (err) {
    throw new Error(`[DB] writeAll(${collection}) failed: ${err.message}`);
  }
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
