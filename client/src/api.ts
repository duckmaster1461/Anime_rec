// src/api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:5000',
  timeout: 10000,
});

// Titles
export async function fetchTitles(q: string, limit = 10) {
  const { data } = await api.get('/api/anime/titles', { params: { q, limit } });
  // expect [{label: string}, ...]
  return Array.isArray(data) ? data : [];
}

// Compare
export async function fetchCompare(anime1: string, anime2: string) {
  const params = { anime1, anime2, sort: 'score', order: 'desc' };
  const { data } = await api.get('/api/anime', { params });
  // expect { results: IAnimeFinal[], total?: number }
  return data;
}
