// src/api.ts
import axios from 'axios';

const DEV_API = 'http://localhost:5000';
const PROD_API = 'https://anime-rec-server.onrender.com'; // <-- HTTPS!

const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1');

export const api = axios.create({
  baseURL: isLocalhost ? DEV_API : PROD_API,
  timeout: 10000,
});

// Titles
export async function fetchTitles(q: string, limit = 10) {
  const { data } = await api.get('/api/anime/titles', { params: { q, limit } });
  return Array.isArray(data) ? data : [];
}

// Compare
export async function fetchCompare(anime1: string, anime2: string) {
  const params = { anime1, anime2, sort: 'score', order: 'desc' };
  const { data } = await api.get('/api/anime', { params });
  return data;
}
