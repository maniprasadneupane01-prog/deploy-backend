'use strict';
const fs   = require('fs');
const path = require('path');

const DEFAULT_DATA_DIR = path.join(__dirname, '../data');
const FALLBACK_DIR = '/tmp/biraj-data';

function isDirWritable(dir) {
  try {
    fs.accessSync(dir, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

function resolveDataDir() {
  // 1. Try the configured DATA_DIR env var
  if (process.env.DATA_DIR) {
    const configured = path.resolve(process.env.DATA_DIR);
    if (isDirWritable(configured)) return configured;
    // Dir doesn't exist — try to create it
    try {
      fs.mkdirSync(configured, { recursive: true });
      if (isDirWritable(configured)) {
        console.log(`[DB] Created data directory at ${configured}`);
        return configured;
      }
    } catch {
      // Cannot create or not writable — fall through
    }
    console.warn(`[DB] WARNING: DATA_DIR=${configured} is not writable. Falling back.`);
  }

  // 2. Try the repo's local data directory
  if (isDirWritable(DEFAULT_DATA_DIR)) return DEFAULT_DATA_DIR;

  // 3. Try /tmp (always writable on Render, but ephemeral)
  try {
    fs.mkdirSync(FALLBACK_DIR, { recursive: true });
    if (isDirWritable(FALLBACK_DIR)) {
      console.warn(`[DB] WARNING: Using /tmp/biraj-data (data resets on restart).`);
      console.warn(`[DB] To persist data on Render, add a Persistent Disk and set DATA_DIR.`);
      return FALLBACK_DIR;
    }
  } catch {
    // fall through
  }

  // 4. Last resort — crash with clear message
  console.error('[DB] FATAL: No writable data directory found.');
  console.error('[DB] On Render: Dashboard → Your Service → Disks → Create Disk → Mount at /app/data');
  console.error('[DB] Then set env var: DATA_DIR=/app/data');
  process.exit(1);
}

const DATA_DIR = resolveDataDir();

function initDB() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      console.log(`[DB] Created data directory at ${DATA_DIR}`);
    } catch (err) {
      console.error(`[DB] FATAL: Cannot create data directory at ${DATA_DIR}: ${err.message}`);
      process.exit(1);
    }
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
