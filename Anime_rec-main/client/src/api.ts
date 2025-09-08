// src/api.ts
import axios from 'axios';

// Expect REACT_APP_API_BASE to point to your API root INCLUDING /api
//   e.g.  https://anime-rec-server.onrender.com/api
//         http://localhost:5000/api
//
// Fallbacks:
// - dev: http://localhost:5000/api
// - prod (same-origin): /api
const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1');

const envBase = (process.env.REACT_APP_API_BASE || '').trim();
const fallbackBase = isLocalhost ? 'http://localhost:5000/api' : '/api';

// normalize: remove trailing slash
const API_BASE = (envBase || fallbackBase).replace(/\/$/, '');

export const api = axios.create({
  baseURL: API_BASE, // <-- already includes /api
  timeout: 10000,
});

// ---------- Endpoints (no leading slash) ----------

// Titles
export async function fetchTitles(q: string, limit = 10) {
  const { data } = await api.get('anime/titles', { params: { q, limit } });
  return Array.isArray(data) ? data : [];
}

// Compare
export async function fetchCompare(anime1: string, anime2: string) {
  const params = { anime1, anime2, sort: 'score', order: 'desc' };
  const { data } = await api.get('anime', { params });
  return data;
}
