'use strict';
const { kv } = require('@vercel/kv');

const DATA_DIR = process.env.DATA_DIR
  ? process.env.DATA_DIR
  : './data';

async function initDB() {
  console.log('[DB] Using Vercel KV Redis for data storage');
}

async function readAll(collection) {
  try {
    const data = await kv.get(`biraj_${collection}`);
    return data || [];
  } catch (err) {
    console.error(`[DB] readAll(${collection}) error:`, err.message);
    return [];
  }
}

async function writeAll(collection, data) {
  try {
    await kv.set(`biraj_${collection}`, data);
  } catch (err) {
    console.error(`[DB] writeAll(${collection}) error:`, err.message);
    throw err;
  }
}

async function create(collection, record) {
  const all = await readAll(collection);
  all.push(record);
  await writeAll(collection, all);
  return record;
}

async function findById(collection, id) {
  const all = await readAll(collection);
  return all.find(r => r.id === id) ?? null;
}

async function findMany(collection, filterFn = null) {
  const all = await readAll(collection);
  return filterFn ? all.filter(filterFn) : all;
}

async function updateById(collection, id, updates) {
  const all = await readAll(collection);
  const idx = all.findIndex(r => r.id === id);
  if (idx === -1) return null;
  all[idx] = {
    ...all[idx],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  await writeAll(collection, all);
  return all[idx];
}

async function deleteById(collection, id) {
  const all = await readAll(collection);
  const filtered = all.filter(r => r.id !== id);
  if (filtered.length === all.length) return false;
  await writeAll(collection, filtered);
  return true;
}

async function count(collection, filterFn = null) {
  const results = await findMany(collection, filterFn);
  return results.length;
}

module.exports = {
  initDB,
  readAll, writeAll,
  create, findById, findMany,
  updateById, deleteById, count
};
