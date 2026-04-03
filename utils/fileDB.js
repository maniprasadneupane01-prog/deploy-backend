'use strict';
const fs = require('fs');
const path = require('path');

const inMemoryStore = {
  appointments: [],
  contacts: []
};

let useKV = false;

async function initDB() {
  console.log('[DB] Initializing database...');
  if (process.env.KV_URL) {
    try {
      const { kv } = require('@vercel/kv');
      useKV = true;
      console.log('[DB] Using Vercel KV Redis for data storage');
    } catch (err) {
      console.log('[DB] KV not available, using in-memory store');
    }
  } else {
    console.log('[DB] Using in-memory store (no KV_URL set)');
  }
}

async function readAll(collection) {
  try {
    if (useKV) {
      const { kv } = require('@vercel/kv');
      const data = await kv.get(`biraj_${collection}`);
      return data || [];
    }
    return inMemoryStore[collection] || [];
  } catch (err) {
    console.error(`[DB] readAll(${collection}) error:`, err.message);
    return inMemoryStore[collection] || [];
  }
}

async function writeAll(collection, data) {
  try {
    if (useKV) {
      const { kv } = require('@vercel/kv');
      await kv.set(`biraj_${collection}`, data);
    }
    inMemoryStore[collection] = data;
  } catch (err) {
    console.error(`[DB] writeAll(${collection}) error:`, err.message);
    inMemoryStore[collection] = data;
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
