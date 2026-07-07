import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import config from '../config.js';

const cachePath = join(process.cwd(), config.cacheDir, 'cache.json');

let cache = {};

export function load() {
  if (existsSync(cachePath)) {
    try {
      cache = JSON.parse(readFileSync(cachePath, 'utf-8'));
    } catch {
      cache = {};
    }
  }
  return cache;
}

export function save() {
  const dir = join(process.cwd(), config.cacheDir);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(cachePath, JSON.stringify(cache, null, 2));
}

export function get(hash) {
  return cache[hash] || null;
}

export function set(hash, entry) {
  cache[hash] = entry;
}

export function has(hash) {
  return hash in cache;
}

export function isStale(hash) {
  return !cache[hash];
}
